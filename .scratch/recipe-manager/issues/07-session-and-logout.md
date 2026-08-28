# 07: Session persistence and logout

**What to build:** An authenticated user remains logged in across app launches and can log out safely.

**Blocked by:** 06: User login

**Status:** resolved

- [x] A valid session is restored after restarting the app.
- [x] Logging out clears locally retained authentication state.
- [x] Expired or invalid sessions return the user to the unauthenticated flow.
- [x] Protected requests do not proceed without a valid session.

## Comments

- Added SecureStore-backed session persistence and restoration during app startup.
- Protected API requests now require a valid session, attach its bearer token,
  and clear local state after an unauthorized response.
- The authenticated screen now provides a logout action.
