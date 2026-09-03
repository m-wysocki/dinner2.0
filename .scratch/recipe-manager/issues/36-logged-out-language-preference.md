# 36: Interface language for logged-out users and account-language precedence

**What to build:** The interface language can be switched without being logged in: the choice is stored locally on the device. Language resolution rules: a logged-out user sees their local choice; after login the account's interface language wins and overwrites the local choice; changing the language while logged in still saves to the account as it does today.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Definition of done

- [ ] A logged-out user can switch between Polish and English and the choice persists across app restarts (local storage).
- [ ] On login, the account's interface language takes effect and is stored as the local choice.
- [ ] While logged in, changing the language still persists to the account (existing behaviour unchanged).
- [ ] Language resolution is covered by unit tests (logged-out default pl, local override, login precedence).
- [ ] `apps/mobile` typecheck, lint, and tests pass.

## Comments

-
