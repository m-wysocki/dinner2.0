# 37: Remove API health status block

**What to build:** The developer-facing API health UI is removed from the product: no connection spinner, no "API działa prawidłowo" block, no retry button on user-facing screens. Screens render based on session/auth state only; the health-check machinery in the API client and its tests are deleted.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Definition of done

- [ ] No screen shows API connection status, spinner, success, or retry UI.
- [ ] Health-check code removed from the API client; no dead exports or translations remain (including EN dictionary keys).
- [ ] Screens no longer gate rendering on health-check state; session restore loading state still works.
- [ ] Tests referencing the health block are removed or updated; `apps/mobile` typecheck, lint, and tests pass.

## Comments

-
