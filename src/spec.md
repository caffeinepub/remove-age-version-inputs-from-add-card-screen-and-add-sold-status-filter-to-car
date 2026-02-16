# Specification

## Summary
**Goal:** Fix the post-login “Connection to the backend could not be established” issue in live deployment by reliably extracting/persisting `caffeineAdminToken` from hash-based URLs before Internet Identity redirects, and by improving the readability of backend connection errors.

**Planned changes:**
- Update secret URL parameter parsing to support both `#/route?caffeineAdminToken=...` and `#caffeineAdminToken=...`, persist the token to `sessionStorage`, and remove it from the visible hash without a page reload.
- Proactively extract/store `caffeineAdminToken` during initial app load (before the user clicks login) so it survives the Internet Identity redirect flow.
- Improve the backend connection error UI to display a clear English message, include at least one suggested user action, and surface non-sensitive underlying initialization details without exposing any secret values.

**User-visible outcome:** Users can log in successfully in live deployment when a valid `caffeineAdminToken` is present in the URL, and if backend initialization fails they see a clearer English error with actionable next steps and safe diagnostic details.
