# Specification

## Summary
**Goal:** Simplify the card edit dialog by removing Age/Version inputs and make Save/Sell actions feel faster by closing dialogs immediately after successful mutations.

**Planned changes:**
- Remove the "Age" and "Version" input fields from the card edit dialog UI and adjust form/validation so saving edits no longer requires those fields.
- Ensure saving an edited card preserves the existing stored age/version values (do not clear or overwrite them).
- Update the edit-card "Save" flow to close the dialog and show success feedback immediately after a successful backend response, while triggering any needed React Query refreshes in the background (avoid sequential awaited invalidations/refetches).
- Update the "Sell" (mark as sold) flow to close the dialog and show success feedback immediately after a successful backend response, while triggering any needed React Query refreshes in the background (avoid sequential awaited invalidations/refetches).
- Prevent duplicate toasts and avoid refetch loops while maintaining existing error handling (errors keep the dialog open and show a toast).

**User-visible outcome:** Users can edit cards without seeing or filling Age/Version fields, and both saving edits and selling a card close the dialog promptly with success feedback while the list/metrics update shortly afterward.
