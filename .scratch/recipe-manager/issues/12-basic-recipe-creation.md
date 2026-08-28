# 12: Basic recipe creation

**What to build:** An active user can create and save a recipe with its basic descriptive fields.

**Blocked by:** 11: Recipe domain and ingredient catalog

**Status:** resolved

- [x] User can enter title, optional description, and serving count.
- [x] Required fields are validated at the client and API boundaries.
- [x] A recipe is associated with the authenticated user.
- [x] Successful creation is visible through the API and mobile flow.

## Comments

Implemented `POST /api/v1/recipes`, shared recipe contracts, active-user access
checks, the mobile creation form, and focused API/mobile/shared tests.
