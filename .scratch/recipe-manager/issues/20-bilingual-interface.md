# 20: Polish and English interface

**What to build:** The first vertical slice supports Polish and English interface languages.

**Blocked by:** 03: Mobile bootstrap and API client

**Status:** resolved

- [x] Polish is the default interface language.
- [x] English translations exist for all first-slice user-facing text.
- [x] User can switch interface language.
- [x] Language preference persists across app launches.
- [x] User-facing strings are not hard-coded in screens.

## Comments

- Added `apps/mobile/src/i18n/` with typed `pl`/`en` dictionaries (key parity
  enforced at compile time and asserted by a unit test), a `translate`
  helper with `{param}` interpolation, Polish-aware `formatServings`, and
  localized `unitLabel` values. Polish is the default language and the
  fallback when no session exists.
- Added an `I18nProvider` in the root layout plus a `useI18n()` hook; screens
  read `t()` from the context and re-render on language change. `session.ts`
  gained a `subscribeToSession` listener so the provider tracks session-driven
  language changes (login/logout/language switch).
- Every first-slice screen (`index`, `user`, `login`, `register`, `confirm`,
  `create-recipe`, `recipes/[id]`, `edit-recipe/[id]`, and `recipe-form`)
  now renders through `t()`; accessibility labels, placeholders, and inline
  messages are translated. The recipe form and details use `unitLabel` so
  canonical units display as localized labels (e.g. `TSP` -> łyżeczka / tsp).
- Language switching lives on a new `/language` screen linked from the user
  screen. Selecting a language optimistically updates the UI, persists via a
  new `PATCH /api/v1/auth/me` endpoint (Prisma `User.interfaceLanguage`),
  stores the refreshed user in the persisted session, and reverts with an
  error message if saving fails.
- API: added `updateUserRequestSchema` to the shared package, an
  `updateCurrentUser` auth service method, and a guarded
  `PATCH /api/v1/auth/me` controller endpoint, with controller, service, and
  HTTP e2e coverage.
- Client-side generated error strings (`api.sessionExpired`,
  `api.networkError`, `api.httpError`, `api.invalidResponse`) and auth-form
  messages are now localized; server-provided `error.message` safe messages
  are surfaced as-is.
- Polish pluralization is case-aware: `formatServings` supports an accusative
  form so the saved-recipe message reads "Przepis na 1 porcję" (not
  "1 porcja"). Recipe details render ingredient lines without leading-space
  artifacts for optional quantities and the `OTHER` unit.
- Verified with workspace tests (shared 36, api 97, mobile 73), typecheck,
  lint, and format check.
