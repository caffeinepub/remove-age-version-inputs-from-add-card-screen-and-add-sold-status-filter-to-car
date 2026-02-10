import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { type Card, type UserProfile, type CardId, PaymentMethod, Position, type InvestmentTotals, type TransactionSummary, type TransactionGroup, type Time } from '../backend';
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
        throw new Error('Actor nicht verfügbar');
      }
      if (!identity) {
        console.warn('Identity not available for profile query');
        throw new Error('Nicht angemeldet');
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
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profil erfolgreich gespeichert');
    },
    onError: (error: Error) => {
      console.error('Error saving profile:', error);
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });
}

// Card Queries
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
    refetchOnMount: 'always',
    staleTime: 0,
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
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
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
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalInvested'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalReturns'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['investmentTotals'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['craftedCardsCount'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['craftedCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Karte erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      console.error('Error adding card:', error);
      toast.error(`Fehler beim Hinzufügen: ${error.message}`);
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
    }) => {
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.updateCard(
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
    },
    onSuccess: () => {
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalInvested'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalReturns'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['investmentTotals'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['craftedCardsCount'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['craftedCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Karte erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      console.error('Error updating card:', error);
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
}

export function useDeleteCard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (cardId: CardId) => {
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.deleteCard(cardId);
    },
    onSuccess: () => {
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalInvested'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalReturns'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['investmentTotals'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['craftedCardsCount'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['craftedCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Karte erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      console.error('Error deleting card:', error);
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });
}

export function useUpdateSalePrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ cardId, newSalePrice }: { cardId: CardId; newSalePrice: number }) => {
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.updateSalePrice(cardId, newSalePrice);
    },
    onSuccess: () => {
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalReturns'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Verkaufspreis aktualisiert');
    },
    onError: (error: Error) => {
      console.error('Error updating sale price:', error);
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
}

export function useMarkCardAsSold() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ cardId, salePrice, saleDate }: { cardId: CardId; salePrice: number; saleDate: Time | null }) => {
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.markCardAsSold(cardId, salePrice, saleDate);
    },
    onSuccess: () => {
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['totalReturns'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Karte als verkauft markiert');
    },
    onError: (error: Error) => {
      console.error('Error marking card as sold:', error);
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

export function useRecordTradeTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ givenCardIds, receivedCardIds }: { givenCardIds: CardId[]; receivedCardIds: CardId[] }) => {
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.recordTradeTransaction(givenCardIds, receivedCardIds);
    },
    onSuccess: () => {
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Tausch erfolgreich aufgezeichnet');
    },
    onError: (error: Error) => {
      console.error('Error recording trade:', error);
      toast.error(`Fehler beim Aufzeichnen: ${error.message}`);
    },
  });
}

export function useRevertTradeTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (cardIds: CardId[]) => {
      if (!actor) throw new Error('Actor nicht verfügbar');
      if (!identity) throw new Error('Nicht angemeldet');
      return actor.revertTradeTransaction(cardIds);
    },
    onSuccess: () => {
      // Trigger invalidations in background without blocking
      queryClient.invalidateQueries({ queryKey: ['userCards'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['transactionGroups'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['soldCardBalance'], refetchType: 'active' });
      toast.success('Tausch erfolgreich rückgängig gemacht');
    },
    onError: (error: Error) => {
      console.error('Error reverting trade:', error);
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

// Portfolio Queries
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
  });
}
