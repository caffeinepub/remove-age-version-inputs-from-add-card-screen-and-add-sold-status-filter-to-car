# Specification

## Summary
**Goal:** Ensure sold-card balance calculations and the sold-cards balance UI correctly exclude Essence purchase costs and show the total purchase cost for sold cards.

**Planned changes:**
- Update backend sold-card balance logic so sold cards purchased/crafted with payment method `essence` contribute their sale price but subtract 0 purchase cost (non-Essence behavior, including discounts, remains unchanged).
- Update the "Bilanz verkaufter Karten" UI to add a new summary metric labeled "Purchase total" to the left of "Sale proceeds", summing discounted purchase prices for sold cards excluding `essence` (Essence contributes 0), formatted in euros with 2 decimals.

**User-visible outcome:** In "Bilanz verkaufter Karten", users see a new "Purchase total" next to "Sale proceeds", and the sold-card balance no longer reduces results due to Essence-based purchase costs.
