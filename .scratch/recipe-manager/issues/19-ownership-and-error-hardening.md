# 19: Ownership and error hardening

**What to build:** The recipe workflow has explicit security, validation, and error guarantees.

**Blocked by:** 18: Recipe deletion

**Status:** resolved

- [x] Integration tests prove users cannot read, update, or delete another user's recipes.
- [x] API validates all recipe, ingredient, and step input.
- [x] API errors use the agreed machine-readable shape.
- [x] Atomic failure leaves no partial recipe data.
- [x] Sensitive data and credentials are not logged.

## Comments

- Added `recipes.e2e.spec.ts`, an HTTP integration suite over the REST seam
  with a fake ownership-enforcing database: recipes are only reachable through
  queries scoped to the caller's owner id, so cross-user reads, updates, and
  deletes all yield the same safe `404 RECIPE_NOT_FOUND`, the collection never
  leaks another user's recipes, and a user cannot reference another user's
  custom catalog ingredient (`422 INGREDIENT_NOT_ACCESSIBLE`).
- The suite asserts the machine-readable error shape for validation (`400
  VALIDATION_ERROR` with `details` paths), domain errors, and unexpected
  failures (`500 INTERNAL_ERROR` with a safe message that never echoes the
  underlying exception).
- Atomicity is proven at the HTTP boundary: a write that fails mid-transaction
  rolls back completely, leaving no partial recipe in the store.
- Hardened the shared ingredient quantity schema: quantities must be a positive
  decimal (`Number(value) > 0`), so `0`/`0.00` are rejected while `null` still
  expresses "to taste". This matches CONTEXT.md's "avoid zero quantity".
- Hardened `ApiErrorFilter` logging: only server errors are logged, and only
  the exception message is logged (never a full stringification that could
  embed sensitive data). Filter spec asserts client errors are not logged,
  internal errors are logged, and responses never leak internals.
- Verified with workspace tests, typecheck, lint, format check (only the local
  generated `expo-env.d.ts` is flagged, unchanged), and build.
