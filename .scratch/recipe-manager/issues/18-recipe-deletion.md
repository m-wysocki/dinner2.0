# 18: Recipe deletion

**What to build:** A user can permanently delete an owned recipe.

**Blocked by:** 16: Recipe details

**Status:** resolved

- [x] Owner can permanently delete a recipe and its child data.
- [x] Deleted recipes no longer appear in the collection.
- [x] A user cannot delete another user's recipe.
- [x] The mobile UI handles confirmation, success, and failure.

## Comments

- Added `DELETE /api/v1/recipes/:id` returning `204 No Content` with the same
  ownership and UUID checks as read/update; the Prisma cascade removes
  ingredients and preparation steps with the recipe.
- Added `apiClient.deleteRecipe` plus `DELETE` method and `204` no-content
  handling in the shared request helper.
- The details screen now offers a destructive "Usuń przepis" action behind an
  `Alert` confirmation, invalidates the details/collection caches and navigates
  back on success, and shows a safe inline error on failure.
- Verified with the workspace test, typecheck, lint, format, and build commands.
