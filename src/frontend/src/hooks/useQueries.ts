import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { type Card, type UserProfile, type CardId, PaymentMethod, Position, type InvestmentTotals, type Time, type PortfolioSnapshot, TransactionType } from '../backend';
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
  const principal = identity?.getPrincipal().toString();

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
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
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
  const principal = identity?.getPrincipal().toString();

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
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
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
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async (cardId: CardId) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.deleteCard(cardId);
    },
    onMutate: async (cardId: CardId) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.userCards(principal) });
      await queryClient.cancelQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      
      // Snapshot the previous values for both caches
      const previousCards = queryClient.getQueryData<Card[]>(queryKeys.userCards(principal));
      const previousPortfolio = queryClient.getQueryData<PortfolioSnapshot>(queryKeys.portfolioSnapshot(principal));
      
      // Optimistically update userCards to remove the card
      if (previousCards) {
        queryClient.setQueryData<Card[]>(
          queryKeys.userCards(principal),
          previousCards.filter(card => card.id !== cardId)
        );
      }
      
      // Optimistically update portfolioSnapshot to remove the card
      if (previousPortfolio) {
        const updatedCards = previousPortfolio.allCards.filter(card => card.id !== cardId);
        queryClient.setQueryData<PortfolioSnapshot>(
          queryKeys.portfolioSnapshot(principal),
          {
            ...previousPortfolio,
            allCards: updatedCards,
          }
        );
      }
      
      // Return context with the snapshots
      return { previousCards, previousPortfolio };
    },
    onError: (error: Error, cardId, context) => {
      // Rollback to the previous values on error
      if (context?.previousCards) {
        queryClient.setQueryData(
          queryKeys.userCards(principal),
          context.previousCards
        );
      }
      if (context?.previousPortfolio) {
        queryClient.setQueryData(
          queryKeys.portfolioSnapshot(principal),
          context.previousPortfolio
        );
      }
      console.error('Error deleting card:', error);
      toast.error(`Error deleting: ${error.message}`);
    },
    onSettled: () => {
      // Always refetch after mutation settles (success or error) to ensure sync with backend
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
    },
    onSuccess: () => {
      toast.success('Card deleted successfully');
    },
  });
}

export function useUpdateSalePrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useMutation({
    mutationFn: async ({ cardId, newSalePrice }: { cardId: CardId; newSalePrice: number }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not logged in');
      return actor.updateSalePrice(cardId, newSalePrice);
    },
    onSuccess: () => {
      // Consolidated invalidation: only portfolioSnapshot and userCards
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSnapshot(principal) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCards(principal) });
      toast.success('Sale price updated');
    },
    onError: (error: Error) => {
      console.error('Error updating sale price:', error);
      toast.error(`Error updating: ${error.message}`);
    },
  });
}

// Portfolio Snapshot Query - Single query for all portfolio data
export function useGetPortfolioSnapshot() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery<PortfolioSnapshot>({
    queryKey: queryKeys.portfolioSnapshot(principal),
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

// Derived query: Get crafted cards (Essence payment method) from portfolio snapshot
export function useGetCraftedCards() {
  const { data: portfolio, isLoading, error } = useGetPortfolioSnapshot();
  
  const craftedCards = portfolio?.allCards.filter(card => card.paymentMethod === PaymentMethod.essence) || [];
  
  return {
    data: craftedCards,
    isLoading,
    error,
  };
}

// Transaction groups derived from portfolio snapshot
export interface TransactionGroup {
  forSale: Card[];
  sold: Card[];
  tradedGiven: Card[];
  tradedReceived: Card[];
}

export function useGetTransactionGroups() {
  const { data: portfolio, isLoading, error } = useGetPortfolioSnapshot();
  
  const transactionGroups: TransactionGroup = {
    forSale: [],
    sold: [],
    tradedGiven: [],
    tradedReceived: [],
  };
  
  if (portfolio?.allCards) {
    portfolio.allCards.forEach(card => {
      switch (card.transactionType) {
        case TransactionType.forSale:
          transactionGroups.forSale.push(card);
          break;
        case TransactionType.sold:
          transactionGroups.sold.push(card);
          break;
        case TransactionType.tradedGiven:
          transactionGroups.tradedGiven.push(card);
          break;
        case TransactionType.tradedReceived:
          transactionGroups.tradedReceived.push(card);
          break;
      }
    });
  }
  
  return {
    data: transactionGroups,
    isLoading,
    error,
  };
}

// Stub implementations for missing backend methods
// These show appropriate error messages until backend support is added

export function useMarkCardAsSold() {
  return useMutation({
    mutationFn: async ({ cardId, salePrice, saleDate }: { cardId: CardId; salePrice: number; saleDate: Time | null }) => {
      toast.error('Selling cards is not yet supported. Please contact support.');
      throw new Error('Backend method markCardAsSold not implemented');
    },
    onError: (error: Error) => {
      console.error('Error marking card as sold:', error);
    },
  });
}

export function useRecordTradeTransaction() {
  return useMutation({
    mutationFn: async ({ givenCardIds, receivedCardIds }: { givenCardIds: CardId[]; receivedCardIds: CardId[] }) => {
      toast.error('Trading cards is not yet supported. Please contact support.');
      throw new Error('Backend method recordTradeTransaction not implemented');
    },
    onError: (error: Error) => {
      console.error('Error recording trade:', error);
    },
  });
}

export function useRevertTradeTransaction() {
  return useMutation({
    mutationFn: async (cardIds: CardId[]) => {
      toast.error('Reverting trades is not yet supported. Please contact support.');
      throw new Error('Backend method revertTradeTransaction not implemented');
    },
    onError: (error: Error) => {
      console.error('Error reverting trade:', error);
    },
  });
}

// Legacy queries kept for backward compatibility but deprecated
// These are now derived from portfolioSnapshot where possible
export function useCalculateTotalInvested() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery<number>({
    queryKey: queryKeys.totalInvested(principal),
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
  const principal = identity?.getPrincipal().toString();

  return useQuery<number>({
    queryKey: queryKeys.totalReturns(principal),
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
  const principal = identity?.getPrincipal().toString();

  return useQuery<InvestmentTotals>({
    queryKey: queryKeys.investmentTotals(principal),
    queryFn: async () => {
      if (!actor) return { totalCashInvested: 0, totalEthInvested: 0 };
      if (!identity) return { totalCashInvested: 0, totalEthInvested: 0 };
      return actor.calculateInvestmentTotals();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}

export function useGetSoldCardBalance() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  return useQuery<number>({
    queryKey: queryKeys.soldCardBalance(principal),
    queryFn: async () => {
      if (!actor) return 0;
      if (!identity) return 0;
      return actor.getSoldCardBalance();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30000,
  });
}
