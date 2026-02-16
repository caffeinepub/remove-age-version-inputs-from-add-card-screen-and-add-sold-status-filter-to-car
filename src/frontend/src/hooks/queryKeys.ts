import { Principal } from '@dfinity/principal';

/**
 * Centralized query key factory for principal-scoped queries.
 * Ensures consistent cache key usage across optimistic updates, invalidation, and refetch.
 */
export const queryKeys = {
  userCards: (principal: string | undefined) => ['userCards', principal] as const,
  portfolioSnapshot: (principal: string | undefined) => ['portfolioSnapshot', principal] as const,
  currentUserProfile: (principal: string | undefined) => ['currentUserProfile', principal] as const,
  investmentTotals: (principal: string | undefined) => ['investmentTotals', principal] as const,
  totalInvested: (principal: string | undefined) => ['totalInvested', principal] as const,
  totalReturns: (principal: string | undefined) => ['totalReturns', principal] as const,
  transactionSummary: (principal: string | undefined) => ['transactionSummary', principal] as const,
  transactionGroups: (principal: string | undefined) => ['transactionGroups', principal] as const,
  craftedCardsCount: (principal: string | undefined) => ['craftedCardsCount', principal] as const,
  soldCardBalance: (principal: string | undefined) => ['soldCardBalance', principal] as const,
};
