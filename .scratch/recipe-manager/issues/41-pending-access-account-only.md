# 41: Pending-access users go straight to the Account screen

**What to build:** A user whose access is pending activation lands on the Account screen (status message, email, sign-out) wherever they navigate: the Recipe collection and Add recipe destinations are hidden/unavailable for them until access is activated.

**Blocked by:** 35: App shell with responsive navigation

**Status:** ready-for-agent

## Definition of done

- [ ] A pending-access user visiting the home route or the create-recipe route is redirected to the Account screen.
- [ ] The shell does not offer the Recipe collection or Add recipe destinations to a pending-access user (Account remains).
- [ ] The Account screen still shows the pending status message and email; activation flips the state and unlocks the destinations.
- [ ] Routing tests cover pending-access redirects; `apps/mobile` typecheck, lint, and tests pass.

## Comments

-
