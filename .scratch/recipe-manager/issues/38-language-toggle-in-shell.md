# 38: PL/EN toggle in the shell; remove the language screen

**What to build:** The PL/EN toggle lives in the shell so it is reachable everywhere, including before login: in the sidebar on desktop, and in the top app bar (screen title area) on mobile. The dedicated language screen is removed along with its entry point from the account screen.

**Blocked by:** 35: App shell with responsive navigation, 36: Interface language for logged-out users and account-language precedence

**Status:** resolved

## Definition of done

- [ ] PL/EN toggle is visible in the desktop sidebar and in the mobile top app bar on every screen with the shell.
- [ ] The toggle works for logged-out users (local choice) and logged-in users (saved to account) per ticket 36 semantics.
- [ ] The language screen route is deleted; no screen links to it; related translations and tests are cleaned up.
- [ ] The mobile top app bar shows the current screen's title.
- [ ] Auth screens are excluded here only where ticket 40 handles them (they get their own corner toggle there).
- [ ] `apps/mobile` typecheck, lint, and tests pass.

## Comments

-
