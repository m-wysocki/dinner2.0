# 39: Account zone: desktop user dropdown, mobile on the Account screen

**What to build:** The account identity and sign-out get a dedicated zone. On desktop, the bottom of the sidebar shows the signed-in user's email with an expandable user control containing the "Wyloguj się" option. On mobile, sign-out lives on the Account screen. The red ghost sign-out button disappears from the recipe collection screen body; "signed in as" info is no longer duplicated in screen content.

**Blocked by:** 35: App shell with responsive navigation

**Status:** ready-for-agent

## Definition of done

- [ ] Desktop sidebar bottom shows the user's email and a user control that expands to reveal "Wyloguj się".
- [ ] Mobile keeps sign-out on the Account screen.
- [ ] No sign-out button remains in the collection screen body; the email is not duplicated in screen content.
- [ ] Signing out clears the session and lands on the login screen without a confirmation dialog.
- [ ] Dropdown closes on selection and on outside interaction; works with keyboard/reader on web.
- [ ] `apps/mobile` typecheck, lint, and tests pass (sign-out tests updated to the new placement).

## Comments

-
