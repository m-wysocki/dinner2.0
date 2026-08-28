# 10: Active access state

**What to build:** An administrator can manually mark a user active in the database, after which the user can enter the protected application shell.

**Blocked by:** 09: Pending access state

**Status:** resolved

- [x] `ACTIVE` status is represented in the application user model.
- [x] A manually activated user passes the access gate.
- [x] Access requires both email confirmation and active application status.
- [x] No administrator panel is introduced.

## Resolution

`ACTIVE` is available in the Prisma and shared application user models. Protected
API access is granted only when the verified user is active and their email is
confirmed. The mobile shell refreshes `/auth/me` when restoring a session, so a
user activated manually in the database can enter the active shell without
logging in again. No administrator panel was added.
