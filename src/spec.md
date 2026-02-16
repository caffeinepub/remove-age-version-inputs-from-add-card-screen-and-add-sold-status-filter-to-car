# Specification

## Summary
**Goal:** Improve perceived performance by reducing redundant React Query refetching, cutting down Portfolio page network calls, and tuning caching/invalidation to avoid refetch storms.

**Planned changes:**
- Adjust the Cards list React Query configuration to avoid unconditional refetches on every mount (use a non-zero `staleTime`, avoid `refetchOnMount="always"` unless clearly justified), and show cached cards immediately while background refresh runs.
- Add a single backend query that returns a Portfolio summary/snapshot (including totalInvested, totalReturns, investmentTotals, transactionSummary, soldCardBalance, craftedCardsCount, and transactionGroups if needed) and update the Portfolio page to use it instead of many parallel aggregate queries.
- Consolidate React Query invalidations after portfolio-related mutations to the minimal set of keys (e.g., portfolio snapshot + userCards) to prevent excessive refetch cascades and reduce long post-mutation loading states.
- Ensure any loading/error/help text added or changed during this work is in English.

**User-visible outcome:** Tabs like Portfolio/Cards feel smoother with shorter load times; cached cards appear immediately when available; the Portfolio page loads with noticeably fewer network requests; and post-mutation updates avoid long full-page reloading.
