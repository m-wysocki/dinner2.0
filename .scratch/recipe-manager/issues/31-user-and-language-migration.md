# 31: User and language screens migration

**What to build:** The user profile screen and the interface-language screen are rebuilt on the reusables primitives with token-based className styling; account info, sign-out, and language switching behavior are unchanged.

**Blocked by:** 30: Recipe details screen migration

**Status:** resolved

## Definition of done

- [x] User and language screens use reusables primitives; StyleSheet styling removed.
- [x] Language selection still switches between Polish and English with immediate effect.
- [x] Existing user and language screen tests pass (updated to the new markup where needed).
- [x] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- Merged into one ticket per user decision: both screens are small.
