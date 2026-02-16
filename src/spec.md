# Specification

## Summary
**Goal:** Make change history fully traceable and easier to read by recording before/after field changes for card edits and showing clearer history details (names + absolute timestamps) in the History UI.

**Planned changes:**
- Backend: Enhance `updateCard` history logging so edit entries include each changed field with before/after values; if no effective changes occurred, consistently either skip creating an entry or record “No changes”.
- Backend: Improve history summaries for other card modifications to include relevant before/after context (sale price updates, delete card including last known name when available, mark as sold including sale price and a human-readable sale date/time).
- Frontend: Update the History page to display card names next to IDs when resolvable and show an explicit absolute date/time for each entry while keeping the existing relative-time display and current pagination/infinite-load behavior.

**User-visible outcome:** The History page shows more informative entries for card changes (including card names and absolute timestamps), and card edit-related history clearly lists what fields changed with old/new values.
