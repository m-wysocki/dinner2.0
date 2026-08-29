# 17: Recipe editing

**What to build:** A user can edit all supported recipe fields, ingredients, and preparation steps.

**Blocked by:** 16: Recipe details

**Status:** resolved

- [x] User can change basic recipe fields.
- [x] User can add, remove, edit, and reorder ingredients.
- [x] User can add, remove, edit, and reorder steps.
- [x] Updates are validated and persisted atomically.

## Comments

- Added `PATCH /api/v1/recipes/:id` with ownership checks and atomic replacement of
  ingredients and steps (delete-and-recreate inside a single transaction).
- Added shared `updateRecipeRequestSchema`, ingredient position validation, and
  `hasConsecutivePositions` helper reused by steps and ingredients.
- Extracted a shared `RecipeForm` component used by the create and new edit screens;
  the edit screen pre-fills the loaded recipe and invalidates the details/collection
  caches after saving.
- Edit updates accept already-deactivated catalog entries so existing recipes stay
  editable; creation still requires active entries.
- Verified with the workspace test, typecheck, lint, format, and build commands.
