# 32: Manual recipe creation migration (shared form + create screen)

**What to build:** The shared recipe form component and the manual recipe creation screen are rebuilt on the reusables primitives with token-based className styling; entering name, servings, ingredients, and preparation steps works as before.

**Blocked by:** 31: User and language screens migration

**Status:** ready-for-agent

## Definition of done

- [ ] The shared recipe form component uses reusables Input, Label, Text, Button; StyleSheet styling removed.
- [ ] The create screen renders the migrated form; draft state and AI-assisted entry redirect unaffected.
- [ ] Existing create screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- The form is migrated inside this ticket (not separately) so the edit screen ticket can consume an already-migrated form.
