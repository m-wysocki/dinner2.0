# 08: Current-user endpoint

**What to build:** The authenticated application can retrieve the current application user from the verified session.

**Blocked by:** 07: Session persistence and logout

**Status:** ready-for-agent

- [ ] The API exposes current-user behavior through the versioned REST contract.
- [ ] JWT verification determines the user identity server-side.
- [ ] Client-supplied user IDs cannot change the resolved identity.
- [ ] Unauthenticated requests are rejected consistently.
