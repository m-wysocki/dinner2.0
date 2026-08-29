# 13: Recipe ingredients

**What to build:** A user can add structured ingredients to a recipe and confirm or create their canonical identities.

**Blocked by:** 12: Basic recipe creation

**Status:** resolved

- [x] User can select a system catalog ingredient.
- [x] User can create a user-owned custom ingredient.
- [x] User can edit name, quantity, unit, note, and order.
- [x] Missing canonical identity blocks saving until corrected.
- [x] Empty quantities are supported for expressions such as “to taste”.

## Comments

- Implemented structured ingredient contracts, atomic recipe ingredient persistence, catalog listing, and user-owned custom ingredient creation.
- Added mobile ingredient entry with canonical catalog selection, optional quantity, note, and unit controls.
- Verified with the workspace test, typecheck, and build commands.

- Merged the previously divergent `13-recipe-ingredients` branch into `main`, keeping `main`'s collection/details screens while integrating the ingredient catalog API, shared contracts, and ingredient entry UI in the create form. Conflict markers in `shared/index.ts`, `recipes.service.ts`, `api/client.ts`, and `create-recipe.tsx` were resolved; `index.tsx` kept `main`'s newer collection screen.
