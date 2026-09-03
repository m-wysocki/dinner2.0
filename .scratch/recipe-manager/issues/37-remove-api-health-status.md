# 37: Remove API health status block

**What to build:** The developer-facing API health UI is removed from the product: no connection spinner, no "API działa prawidłowo" block, no retry button on user-facing screens. Screens render based on session/auth state only; the health-check machinery in the API client and its tests are deleted.

**Blocked by:** None (can start immediately)

**Status:** resolved

## Definition of done

- [x] No screen shows API connection status, spinner, success, or retry UI.
- [x] Health-check code removed from the API client; no dead exports or translations remain (including EN dictionary keys).
- [x] Screens no longer gate rendering on health-check state; session restore loading state still works.
- [x] Tests referencing the health block are removed or updated; `apps/mobile` typecheck, lint, and tests pass.

## Comments

- Implemented: removed the health query and status/spinner/retry UI from `app/index.tsx`, deleted `apiClient.health()` plus the `healthResponseSchema`/`HealthResponse` imports from the mobile client, and dropped the `home.connecting`/`home.connectFailed`/`home.apiWorking`/`home.connected` keys from both PL and EN dictionaries. Tests referencing the health block were rewritten to exercise `request()` behaviour via a neutral schema; the shared `healthResponseSchema` stays because the API server's own `/health` controller still consumes it. Full workspace suite green (shared 48, api 147, mobile 102 tests).
