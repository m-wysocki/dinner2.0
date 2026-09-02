# 30: Recipe details screen migration

**What to build:** The recipe details screen is rebuilt on the reusables primitives with token-based className styling; ingredient list, preparation steps, warm "original recipe" panel, and edit/delete actions are unchanged in behavior.

**Blocked by:** 29: Recipe collection screen migration

**Status:** resolved

## Definition of done

- [x] Details screen uses reusables Card, Text, Button, Separator (and other primitives where they fit); StyleSheet styling removed.
- [x] Secondary tokens (brand, panel.border/label/hint) are used where the warm panel appears.
- [x] Existing details screen tests pass (updated to the new markup where needed).
- [x] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- The ticket description mentions preparation steps and a warm "original recipe" panel; neither exists on the details screen (preparation was folded into the description, and the source text panel lives on the review screen per ADR 0001). "Unchanged in behavior" was therefore applied to what the screen actually has: ingredient list, edit/delete actions. Of the secondary tokens only `brand` appears here; `panel.*` tokens stay exercised by the review screen.
- Test infra: `@rn-primitives/separator` needed a vitest alias stub (`test/mocks/rn-primitives-separator.js`), mirroring the existing slot stub, because the package ships untranspiled JSX that Node cannot parse.
