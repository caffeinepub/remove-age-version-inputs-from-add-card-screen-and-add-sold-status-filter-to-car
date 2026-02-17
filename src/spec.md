# Specification

## Summary
**Goal:** Ensure the History page shows add and sell events for all cards, including cards added/sold before the history feature existed, without creating duplicate history entries.

**Planned changes:**
- Implement a persisted backfill on the backend so each existing card has at least one “added” history entry, and any card already in a sold state also has a corresponding “sold” entry.
- Ensure backfilled and newly-created history entries include a clear English summary identifying the card (card name + card id) and are ordered correctly by timestamp.
- Update the History page UI copy/presentation (English) to clearly reflect add/sell activity and ensure it refreshes automatically after adding or selling (via React Query invalidation/refetch).
- If new stable state is introduced for backfill bookkeeping, add/adjust Motoko upgrade migration so upgrades preserve existing data and initialize new state safely.

**User-visible outcome:** The History page reliably displays understandable Add and Sold entries (with timestamp and card identification) for all cards—past and present—and updates immediately after the user adds a card or marks one as sold.
