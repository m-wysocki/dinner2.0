# 33: Recipe editing screen migration

**What to build:** The recipe editing screen renders the already-migrated shared recipe form with token-based className styling; loading an existing recipe, editing, saving, and deleting work as before.

**Blocked by:** 32: Manual recipe creation migration (shared form + create screen)

**Status:** ready-for-agent

## Definition of done

- [ ] Edit screen chrome (navigation, save/delete actions) uses reusables primitives; StyleSheet styling removed.
- [ ] Editing flows through the shared form migrated in ticket 32 without regression.
- [ ] Existing edit screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.
