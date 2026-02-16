# Specification

## Summary
**Goal:** Ensure card deletion is persisted in the backend and remains consistently reflected across Gallery and Portfolio (including after refresh).

**Planned changes:**
- Backend: Fix the card delete operation so deletions are stored and removed cards are no longer returned by `getAllCardsForUser()`; return a clear error when attempting to delete a non-existent card for the user.
- Frontend: Update React Query delete flow to keep Gallery in sync with backend as the source of truth (consistent cache keys, optimistic update + rollback on failure, and correct invalidation/refetch after delete).
- Frontend: Ensure Portfolio views/metrics update immediately after a Gallery deletion by reliably refetching/updating any portfolio-related cached queries for the active principal.

**User-visible outcome:** When a user deletes a card, it disappears from both Gallery and Portfolio-derived totals/lists immediately, stays deleted after a full page refresh, and shows an error if the deletion fails.
