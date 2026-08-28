# 06: User login

**What to build:** A registered user can log in with email and password.

**Blocked by:** 04: User registration

**Status:** resolved

- [x] Valid credentials establish an authenticated Supabase session.
- [x] Invalid credentials produce a safe, localized user-facing error.
- [x] Unconfirmed accounts receive an actionable confirmation message.
- [x] The mobile UI transitions to the authenticated flow after success.

## Comments

- Implemented as `POST /api/v1/auth/login`, which proxies to Supabase
  `signInWithPassword` and returns the session tokens plus the application user.
- The mobile app stores the session in an in-memory auth store and navigates to
  the `/user` route on success. Cross-launch persistence and the pending/active
  access screens are covered by tickets 07 and 09/10 respectively.
