# 08: Current-user endpoint

**What to build:** The authenticated application can retrieve the current application user from the verified session.

**Blocked by:** 07: Session persistence and logout

**Status:** resolved

- [x] The API exposes current-user behavior through the versioned REST contract.
- [x] JWT verification determines the user identity server-side.
- [x] Client-supplied user IDs cannot change the resolved identity.
- [x] Unauthenticated requests are rejected consistently.

## Comments

- Added `GET /api/v1/auth/me` with Supabase JWT verification and application-user lookup.
- Added API guard, unit tests, and HTTP-level coverage for authenticated and unauthenticated requests.
