# 31: User and language screens migration

**What to build:** The user profile screen and the interface-language screen are rebuilt on the reusables primitives with token-based className styling; account info, sign-out, and language switching behavior are unchanged.

**Blocked by:** 30: Recipe details screen migration

**Status:** ready-for-agent

## Definition of done

- [ ] User and language screens use reusables primitives; StyleSheet styling removed.
- [ ] Language selection still switches between Polish and English with immediate effect.
- [ ] Existing user and language screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- Merged into one ticket per user decision: both screens are small.
