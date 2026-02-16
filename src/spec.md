# Specification

## Summary
**Goal:** Fix card deletion in the gallery to be error-free and add the ability to edit an existing sale price in the card editor while keeping portfolio metrics in sync.

**Planned changes:**
- Fix the card deletion flow so the card is removed successfully and the UI does not crash or show error overlays during/after deletion.
- Ensure portfolio statistics and derived views refresh automatically after a card is deleted (no manual page refresh needed).
- Extend the card edit dialog to show an editable sale price field only when a card already has a salePrice, prefilled with the current value.
- Persist sale price edits and refresh portfolio metrics/views after saving so updated sale price impacts totals/returns without a manual refresh.

**User-visible outcome:** Users can delete cards from the gallery without errors and immediately see updated portfolio totals; users can edit an existing sale price in the card editor and see portfolio metrics update right after saving.
