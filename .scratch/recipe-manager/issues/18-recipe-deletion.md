# 18: Recipe deletion

**What to build:** A user can permanently delete an owned recipe.

**Blocked by:** 16: Recipe details

**Status:** resolved

- [x] Owner can permanently delete a recipe and its child data.
- [x] Deleted recipes no longer appear in the collection.
- [x] A user cannot delete another user's recipe.
- [x] The mobile UI handles confirmation, success, and failure.

## Comments

- Added `DELETE /api/v1/recipes/:id` returning `204 No Content`. Deletion uses
  `deleteMany` scoped by owner id so it is atomic (no check-then-act race) and
  non-owned or missing recipes produce the same `404`; the Prisma cascade
  removes ingredients and preparation steps with the recipe.
- Added `apiClient.deleteRecipe` plus `DELETE` method and `204` no-content
  handling in the shared request helper; the helper's response schema is now
  optional so bodyless calls need no no-op parser.
- The details screen offers a destructive "Usuń przepis" action behind an inline
  confirmation panel (react-native-web's `Alert` is a no-op, so no native dialog
  is used), invalidates the details/collection caches and navigates back on
  success, and shows a safe inline error on failure.
- Verified with the workspace test, typecheck, lint, format, and build commands.
