# 28: Auth screens migration (login, register, confirm)

**What to build:** The three authentication screens (login, registration, email confirmation) are rebuilt on the reusables primitives with token-based className styling; their behavior, validation flow, and error states are unchanged.

**Blocked by:** 27: UI primitives and root layout migration

**Status:** ready-for-agent

## Definition of done

- [ ] Login, register, and confirm screens use reusables Button, Text, Input (and other primitives where they fit); StyleSheet styling removed.
- [ ] Submitting, disabled, and failure states render through the new components with the existing translations.
- [ ] Existing auth screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- Merged into one ticket per user decision: the screens are small and structurally identical.
