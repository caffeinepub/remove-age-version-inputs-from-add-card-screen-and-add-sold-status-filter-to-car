import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { type Card, type UserProfile, type CardId, PaymentMethod, Position, type InvestmentTotals, type Time, type PortfolioSnapshot, TransactionType, type TradeTransaction, type ChangeHistoryEntry } from '../backend';
import { toast } from 'sonner';
import { queryKeys } from './queryKeys';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  const query = useQuery<UserProfile | null>({
    queryKey: queryKeys.currentUserProfile(principal),
    queryFn: async () => {
      if (!actor) {
        console.warn('Actor not available for profile query');
        throw new Error('Actor not available');
      }
      if (!identity) {
        console.warn('Identity not available for profile query');
        throw new Error('Not logged in');
      }
      
      try {
        console.log('Fetching user profile...');
        const profile = await actor.getCallerUserProfile();
        console.log('Profile fetched successfully:', profile);
        return profile;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 3,
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * Math.pow(2, attemptIndex), 5000);
      console.log(`Retrying profile fetch (attempt ${attemptIndex + 1}) after ${delay}ms`);
      return delay;
    },
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: query.isLoading || (!!identity && !query.isFetched && actorFetching),
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUserProfile(principal) });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      console.error('Error saving profile:', error);
      toast.error(`Error saving: ${error.message}`);
    },
  });
}

// Change History Queries
const HISTORY_PAGE_SIZE = 20;

export function useGetChangeHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useInfiniteQuery<ChangeHistoryEntry[]>({
    queryKey: queryKeys.changeHistory(principal),
    queryFn: async ({ pageParam = 0 }) => {
      if (!actor) {
        console.warn('Actor not available for history query');
        return [];
      }
      if (!identity) {
        console.warn('Identity not available for history query');
        return [];
      }

      try {
        const offset = (pageParam as number) * HISTORY_PAGE_SIZE;
        const entries = await actor.getChangeHistory(BigInt(HISTORY_PAGE_SIZE), BigInt(offset));
        return entries;
      } catch (error) {
        console.error('Error fetching change history:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the page size, there are no more pages
      if (lastPage.length < HISTORY_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 30000,
  });
}

// Card Queries
// Caching strategy: staleTime 60s to avoid refetch on every tab switch, no refetchOnMount='always'
export function useGetUserCards() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery<Card[]>({
    queryKey: queryKeys.userCards(principal),
    queryFn: async () => {
      if (!actor) {
        console.warn('Actor not available for cards query');
        return [];
      }
      if (!identity) {
        console.warn('Identity not available for cards query');
        return [];
      }
      
      try {
        console.log('Fetching user cards...');
        const cards = await actor.getAllCardsForUser();
        console.log(`Fetched ${cards.length} cards`);
        return cards;
      } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 60000,
  });
}

export function useGetPortfolioSnapshot() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery<PortfolioSnapshot>({
    queryKey: queryKeys.portfolioSnapshot(principal),
    queryFn: async () => {
      if (!actor) {
        console.warn('Actor not available for portfolio query');
        throw new Error('Actor not available');
      }
      if (!identity) {
        console.warn('Identity not available for portfolio query');
        throw new Error('Not logged in');
      }

      try {
        console.log('Fetching portfolio snapshot...');
        const snapshot = await actor.getPortfolioSnapshot();
        console.log('Portfolio snapshot fetched:', snapshot);
        return snapshot;
      } catch (error) {
        console.error('Error fetching portfolio snapshot:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

// Derived query: Get transaction groups from portfolio snapshot
export function useGetTransactionGroups() {
  const { data: snapshot } = useGetPortfolioSnapshot();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery({
    queryKey: queryKeys.transactionGroups(principal),
    queryFn: () => {
      if (!snapshot) return { sales: [], trades: [] };

      const allCards = snapshot.allCards;
      const sales = allCards.filter(card => card.transactionType === TransactionType.sold);
      const trades = allCards.filter(card => 
        card.transactionType === TransactionType.tradedGiven || 
        card.transactionType === TransactionType.tradedReceived
      );

      return { sales, trades };
    },
    enabled: !!snapshot,
    staleTime: 30000,
  });
}

// Derived query: Get crafted cards from portfolio snapshot
export function useGetCraftedCards() {
  const { data: snapshot } = useGetPortfolioSnapshot();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery({
    queryKey: queryKeys.craftedCardsCount(principal),
    queryFn: () => {
      if (!snapshot) return [];
      
      return snapshot.allCards.filter(card => 
        card.paymentMethod === PaymentMethod.essence && 
        card.transactionType === TransactionType.forSale
      );
    },
    enabled: !!snapshot,
    staleTime: 30000,
  });
}

export function useAddCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      rarity: string;
      purchasePrice: number;
      discountPercent: number;
      paymentMethod: PaymentMethod;
      country: string;
      league: string;
      club: string;
      age: bigint;
      version: string;
      season: string;
      position: Position;
      purchaseDate: Time | null;
      notes: string;
      image: any;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.addCard(
        params.name,
        params.rarity,
        params.purchasePrice,
        params.discountPercent,
        params.paymentMethod,
        params.country,
        params.league,
        params.club,
        params.age,
        params.version,
        params.season,
        params.position,
        params.purchaseDate,
        params.notes,
        params.image
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
      toast.success('Card added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding card:', error);
      toast.error(`Error adding card: ${error.message}`);
    },
  });
}

export function useUpdateCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (params: {
      cardId: CardId;
      name: string;
      rarity: string;
      purchasePrice: number;
      discountPercent: number;
      paymentMethod: PaymentMethod;
      country: string;
      league: string;
      club: string;
      age: bigint;
      version: string;
      season: string;
      position: Position;
      purchaseDate: Time | null;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.updateCard(
        params.cardId,
        params.name,
        params.rarity,
        params.purchasePrice,
        params.discountPercent,
        params.paymentMethod,
        params.country,
        params.league,
        params.club,
        params.age,
        params.version,
        params.season,
        params.position,
        params.purchaseDate,
        params.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
      toast.success('Card updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating card:', error);
      toast.error(`Error updating card: ${error.message}`);
    },
  });
}

export function useUpdateSalePrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (params: { cardId: CardId; newSalePrice: number }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.updateSalePrice(params.cardId, params.newSalePrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
      toast.success('Sale price updated');
    },
    onError: (error: Error) => {
      console.error('Error updating sale price:', error);
      toast.error(`Error updating price: ${error.message}`);
    },
  });
}

export function useDeleteCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (cardId: CardId) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.deleteCard(cardId);
    },
    onMutate: async (cardId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.userCards(principal) });
      await queryClient.cancelQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });

      // Snapshot previous values
      const previousCards = queryClient.getQueryData<Card[]>(queryKeys.userCards(principal));
      const previousSnapshot = queryClient.getQueryData<PortfolioSnapshot>(queryKeys.portfolioSnapshot(principal));

      // Optimistically update userCards
      if (previousCards) {
        queryClient.setQueryData<Card[]>(
          queryKeys.userCards(principal),
          previousCards.filter(card => card.id !== cardId)
        );
      }

      // Optimistically update portfolioSnapshot
      if (previousSnapshot) {
        queryClient.setQueryData<PortfolioSnapshot>(
          queryKeys.portfolioSnapshot(principal),
          {
            ...previousSnapshot,
            allCards: previousSnapshot.allCards.filter(card => card.id !== cardId),
          }
        );
      }

      return { previousCards, previousSnapshot };
    },
    onError: (error: Error, cardId, context) => {
      // Rollback on error
      if (context?.previousCards) {
        queryClient.setQueryData(queryKeys.userCards(principal), context.previousCards);
      }
      if (context?.previousSnapshot) {
        queryClient.setQueryData(queryKeys.portfolioSnapshot(principal), context.previousSnapshot);
      }
      console.error('Error deleting card:', error);
      toast.error(`Error deleting card: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
    },
    onSuccess: () => {
      toast.success('Card deleted successfully');
    },
  });
}

export function useMarkCardAsSold() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (params: { cardId: CardId; salePrice: number; saleDate: Time }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.markCardAsSold(params.cardId, params.salePrice, params.saleDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
      toast.success('Card marked as sold');
    },
    onError: (error: Error) => {
      console.error('Error marking card as sold:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useRecordTradeTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (params: { givenCardIds: CardId[]; receivedCardIds: CardId[] }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.recordTradeTransaction(params.givenCardIds, params.receivedCardIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
      toast.success('Trade recorded successfully');
    },
    onError: (error: Error) => {
      console.error('Error recording trade:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useRevertTradeTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (params: { cardId: CardId; tradeTransaction: TradeTransaction }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      return actor.revertTradeTransaction(params.cardId, params.tradeTransaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory(principal) });
      toast.success('Trade reverted successfully');
    },
    onError: (error: Error) => {
      console.error('Error reverting trade:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}
