# 14: Preparation steps

**What to build:** A user can add and order text preparation steps while creating a recipe.

**Blocked by:** 13: Recipe ingredients

**Status:** resolved

- [x] User can add, edit, and remove preparation steps.
- [x] User can change step order.
- [x] Empty or invalid steps are rejected before saving.
- [x] Recipe, ingredients, and steps save atomically.

## Comments

- Added shared preparation-step contracts and atomic API persistence.
- Added mobile step entry, editing, removal, and ordering controls.
- Verified with the workspace test, typecheck, and build commands.
