# 40: Auth screens without the shell; logged-out redirect to login

**What to build:** Login and registration screens render full-screen without the shell (no sidebar, no tab bar), each with a small PL/EN toggle in the corner so language can be switched before logging in. Visiting the home route while logged out redirects straight to the login screen instead of showing a landing page with login/register buttons.

**Blocked by:** 35: App shell with responsive navigation, 36: Interface language for logged-out users and account-language precedence

**Status:** ready-for-agent

## Definition of done

- [ ] Login and registration screens have no sidebar and no bottom tab bar.
- [ ] Both screens show a compact PL/EN toggle in a corner; switching works for logged-out users and persists per ticket 36.
- [ ] Logged-out visit to the home route redirects to the login screen; no landing buttons remain.
- [ ] The email confirmation screen is consistent with the auth screens' shell-less layout.
- [ ] Routing tests cover the redirect; `apps/mobile` typecheck, lint, and tests pass.

## Comments

-
