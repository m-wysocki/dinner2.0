# 07: Session persistence and logout

**What to build:** An authenticated user remains logged in across app launches and can log out safely.

**Blocked by:** 06: User login

**Status:** ready-for-agent

- [ ] A valid session is restored after restarting the app.
- [ ] Logging out clears locally retained authentication state.
- [ ] Expired or invalid sessions return the user to the unauthenticated flow.
- [ ] Protected requests do not proceed without a valid session.
