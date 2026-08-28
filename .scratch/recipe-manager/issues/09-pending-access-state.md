# 09: Pending access state

**What to build:** A confirmed or unconfirmed user with pending application access sees an activation-waiting experience and cannot access private data.

**Blocked by:** 05: Email confirmation; 08: Current-user endpoint

**Status:** resolved

- [x] New application users have `PENDING` access.
- [x] Pending users can see their access status.
- [x] Pending users cannot access recipe data.
- [x] The mobile UI presents a clear waiting state.

## Resolution

Pending users now receive a valid session after login and can inspect their status through `/auth/me`. Private-data controllers can compose `AuthGuard` with `ActiveAccessGuard`, which rejects pending access with `ACCESS_PENDING`. The mobile account screen presents an activation-waiting state for pending users.
