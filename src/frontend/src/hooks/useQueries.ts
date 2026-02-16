import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { type Card, type UserProfile, type CardId, PaymentMethod, Position, type InvestmentTotals, type TransactionSummary, type TransactionGroup, type Time, type PortfolioSnapshot } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', identity?.getPrincipal().toString()],
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

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      console.error('Error saving profile:', error);
      toast.error(`Error saving: ${error.message}`);
    },
  });
}

// Card Queries
// Caching strategy: staleTime 60s to avoid refetch on every tab switch, no refetchOnMount='always'
export function useGetUserCards() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Card[]>({
    queryKey: ['userCards', identity?.getPrincipal().toString()],
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
        const cards = await actor.getAllCardsForUser();
        console.log(`Fetched ${cards.length} cards`);
        return cards;
      } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 3000),
    // Performance: Cache cards for 60s to avoid refetch on tab navigation
    staleTime: 60000,
    // Performance: Only refetch if data is stale, not on every mount
    refetchOnMount: false,
  });
}

export function useAddCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      name,
      rarity,
      purchasePrice,
      discountPercent,
      paymentMethod,
      purchaseDate,
      notes,
      country,
      league,
      club,
      position,
      age,
      version,
      season,
    }: {
      name: string;
      rarity: string;
      purchasePrice: number;
      discountPercent: number;
      paymentMethod: PaymentMethod;
      purchaseDate: Time | null;
      notes: string;
      country: string;
      league: string;
      club: string;
      position: Position;
      age: number;
      version: string;
      season: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.addCard(
        name,
        rarity,
        purchasePrice,
        discountPercent,
        paymentMethod,
        country,
        league,
        club,
        BigInt(age),
        version,
        season,
        position,
        purchaseDate,
        notes,
        null
      );
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
      toast.success('Card added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding card:', error);
      toast.error(`Error adding: ${error.message}`);
    },
  });
}

export function useUpdateCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      cardId,
      name,
      rarity,
      purchasePrice,
      discountPercent,
      paymentMethod,
      purchaseDate,
      notes,
      country,
      league,
      club,
      position,
      age,
      version,
      season,
      salePrice,
    }: {
      cardId: CardId;
      name: string;
      rarity: string;
      purchasePrice: number;
      discountPercent: number;
      paymentMethod: PaymentMethod;
      purchaseDate: Time | null;
      notes: string;
      country: string;
      league: string;
      club: string;
      position: Position;
      age: number;
      version: string;
      season: string;
      salePrice?: number | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      
      // First update the card fields
      await actor.updateCard(
        cardId,
        name,
        rarity,
        purchasePrice,
        discountPercent,
        paymentMethod,
        country,
        league,
        club,
        BigInt(age),
        version,
        season,
        position,
        purchaseDate,
        notes
      );
      
      // If salePrice is provided and not null, update it separately
      if (salePrice !== undefined && salePrice !== null) {
        await actor.updateSalePrice(cardId, salePrice);
      }
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
      toast.success('Card updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating card:', error);
      toast.error(`Error updating: ${error.message}`);
    },
  });
}

export function useDeleteCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (cardId: CardId) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.deleteCard(cardId);
    },
    onMutate: async (cardId: CardId) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['userCards'] });
      
      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>(['userCards', identity?.getPrincipal().toString()]);
      
      // Optimistically update to remove the card
      if (previousCards) {
        queryClient.setQueryData<Card[]>(
          ['userCards', identity?.getPrincipal().toString()],
          previousCards.filter(card => card.id !== cardId)
        );
      }
      
      // Return context with the snapshot
      return { previousCards };
    },
    onError: (error: Error, cardId, context) => {
      // Rollback to the previous value on error
      if (context?.previousCards) {
        queryClient.setQueryData(
          ['userCards', identity?.getPrincipal().toString()],
          context.previousCards
        );
      }
      console.error('Error deleting card:', error);
      toast.error(`Error deleting: ${error.message}`);
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
      toast.success('Card deleted successfully');
    },
  });
}

export function useUpdateSalePrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ cardId, newSalePrice }: { cardId: CardId; newSalePrice: number }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.updateSalePrice(cardId, newSalePrice);
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
      toast.success('Sale price updated');
    },
    onError: (error: Error) => {
      console.error('Error updating sale price:', error);
      toast.error(`Error updating: ${error.message}`);
    },
  });
}

export function useMarkCardAsSold() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ cardId, salePrice, saleDate }: { cardId: CardId; salePrice: number; saleDate: Time | null }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.markCardAsSold(cardId, salePrice, saleDate);
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
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

  return useMutation({
    mutationFn: async ({ givenCardIds, receivedCardIds }: { givenCardIds: CardId[]; receivedCardIds: CardId[] }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.recordTradeTransaction(givenCardIds, receivedCardIds);
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
      toast.success('Trade recorded successfully');
    },
    onError: (error: Error) => {
      console.error('Error recording trade:', error);
      toast.error(`Error recording: ${error.message}`);
    },
  });
}

export function useRevertTradeTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (cardIds: CardId[]) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.revertTradeTransaction(cardIds);
    },
    onSuccess: () => {
      const principal = identity?.getPrincipal().toString();
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: ['portfolioSnapshot', principal] });
      queryClient.invalidateQueries({ queryKey: ['userCards', principal] });
      toast.success('Trade reverted successfully');
    },
    onError: (error: Error) => {
      console.error('Error reverting trade:', error);
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Portfolio Snapshot Query - Single query for all portfolio data
export function useGetPortfolioSnapshot() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PortfolioSnapshot>({
    queryKey: ['portfolioSnapshot', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) {
        return {
          investmentTotals: { totalCashInvested: 0, totalEthInvested: 0 },
          totalInvested: 0,
          totalBalance: 0,
          totalReturns: 0,
          totalReturnBalance: 0,
          portfolioTotal: 0,
          holdBalance: 0,
          allCards: [],
        };
      }
      if (!identity) {
        return {
          investmentTotals: { totalCashInvested: 0, totalEthInvested: 0 },
          totalInvested: 0,
          totalBalance: 0,
          totalReturns: 0,
          totalReturnBalance: 0,
          portfolioTotal: 0,
          holdBalance: 0,
          allCards: [],
        };
      }
      return actor.getPortfolioSnapshot();
    },
    enabled: !!actor && !isFetching && !!identity,
    // Cache for 30s to reduce redundant fetches
    staleTime: 30000,
  });
}

// Legacy queries kept for backward compatibility but deprecated
// These are now derived from portfolioSnapshot where possible
export function useCalculateTotalInvested() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['totalInvested', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return 0;
      if (!identity) return 0;
      return actor.calculateTotalInvested();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useCalculateTotalReturns() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['totalReturns', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return 0;
      if (!identity) return 0;
      return actor.calculateTotalReturns();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useCalculateInvestmentTotals() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<InvestmentTotals>({
    queryKey: ['investmentTotals', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return { totalCashInvested: 0, totalEthInvested: 0 };
      if (!identity) return { totalCashInvested: 0, totalEthInvested: 0 };
      return actor.calculateInvestmentTotals();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useGetTransactionSummary() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransactionSummary>({
    queryKey: ['transactionSummary', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return { forSaleCount: BigInt(0), soldCount: BigInt(0), tradedGivenCount: BigInt(0), tradedReceivedCount: BigInt(0) };
      if (!identity) return { forSaleCount: BigInt(0), soldCount: BigInt(0), tradedGivenCount: BigInt(0), tradedReceivedCount: BigInt(0) };
      return actor.getTransactionSummary();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useGetTransactionGroups() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransactionGroup>({
    queryKey: ['transactionGroups', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return { forSale: [], sold: [], tradedGiven: [], tradedReceived: [] };
      if (!identity) return { forSale: [], sold: [], tradedGiven: [], tradedReceived: [] };
      return actor.getTransactionGroups();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useCountCraftedCards() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<bigint>({
    queryKey: ['craftedCardsCount', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      if (!identity) return BigInt(0);
      return actor.countCraftedCards();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useGetCraftedCards() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Card[]>({
    queryKey: ['craftedCards', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      if (!identity) return [];
      return actor.getCraftedCards();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useGetSoldCardBalance() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['soldCardBalance', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return 0;
      if (!identity) return 0;
      return actor.getSoldCardBalance();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}
