# 15: Recipe collection and empty state

**What to build:** An active user can see their own saved recipes or a useful empty state.

**Blocked by:** 14: Preparation steps

**Status:** resolved

- [x] Collection contains only recipes owned by the authenticated user.
- [x] Recipes are ordered newest first.
- [x] Empty collection shows a create action.
- [x] API and mobile loading and error states are handled.

## Resolution

The API exposes `GET /api/v1/recipes` and scopes results through the authenticated
application user. The mobile home screen displays the collection and its loading,
error, and empty states.
