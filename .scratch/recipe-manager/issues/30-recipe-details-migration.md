# 30: Recipe details screen migration

**What to build:** The recipe details screen is rebuilt on the reusables primitives with token-based className styling; ingredient list, preparation steps, warm "original recipe" panel, and edit/delete actions are unchanged in behavior.

**Blocked by:** 29: Recipe collection screen migration

**Status:** ready-for-agent

## Definition of done

- [ ] Details screen uses reusables Card, Text, Button, Separator (and other primitives where they fit); StyleSheet styling removed.
- [ ] Secondary tokens (brand, panel.border/label/hint) are used where the warm panel appears.
- [ ] Existing details screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.
