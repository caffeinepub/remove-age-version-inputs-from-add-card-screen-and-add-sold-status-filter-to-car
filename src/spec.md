# Specification

## Summary
**Goal:** Add a sold-cards balance overview to the Portfolio that aggregates purchase costs minus sale proceeds for sold cards.

**Planned changes:**
- Add a new authenticated backend query in `backend/main.mo` that aggregates sold cards only (`transactionType == #sold`) and returns `totalPurchaseCost`, `totalSaleProceeds`, and `soldBalancePurchaseMinusSales`.
- Implement purchase-cost calculation consistent with existing logic: `purchasePrice * (1 - discountPercent/100)`, and treat `PaymentMethod #essence` purchase cost as `0.0`.
- Add a new React Query hook in `frontend/src/hooks/useQueries.ts` to fetch/cache the sold-cards balance under a stable key scoped to the logged-in principal and refetch via the existing portfolio invalidation strategy.
- Update `frontend/src/pages/PortfolioPage.tsx` to display a second, separate overview section/card showing total sold purchase cost, total sold sale proceeds, and the resulting sold balance, with a graceful empty state.

**User-visible outcome:** The Portfolio page shows an additional summary section that displays an aggregated balance for sold cards (purchase costs minus sale proceeds), including totals and a computed balance, even when there are no sold cards.
