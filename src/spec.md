# Specification

## Summary
**Goal:** Stop the app from getting stuck on the “Connecting…” screen after Internet Identity login by correctly surfacing actor initialization failures and providing clear recovery actions.

**Planned changes:**
- Update the app’s post-login/actor initialization UI flow to show “Connecting…” only while an actor initialization attempt is actively in progress.
- When actor initialization fails (React Query error) or stops fetching without producing an actor, transition to a user-visible error/timeout state instead of spinning indefinitely.
- Add an English error view for backend connection/actor init failure with actions to Retry (re-attempt actor initialization) and Log out (available from the error state).

**User-visible outcome:** After logging in, the user either reaches the main tabs view with Portfolio selected (when initialization succeeds) or sees an English error/timeout message with Retry and Log out options instead of an endless “Connecting…” spinner.
