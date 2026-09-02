# 29: Recipe collection screen migration

**What to build:** The recipe collection listing (home screen) is rebuilt on the reusables primitives with token-based className styling; listing, empty state, loading, and error behavior are unchanged.

**Blocked by:** 28: Auth screens migration (login, register, confirm)

**Status:** ready-for-agent

## Definition of done

- [ ] Collection screen uses reusables Card, Text, Button (and other primitives where they fit); StyleSheet styling removed.
- [ ] Recipe rows navigate to recipe details as before.
- [ ] Existing collection screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.
