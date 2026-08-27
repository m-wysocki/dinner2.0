# 05: Email confirmation

**What to build:** A registered user can confirm their email and the application reflects the confirmation state.

**Blocked by:** 04: User registration

**Status:** resolved

- [x] Confirmation links are handled through the configured Supabase Auth flow.
- [x] Unconfirmed and confirmed states are distinguishable by the API.
- [x] The mobile UI explains the need to confirm the email.
- [x] Confirmation is required in development as well as production.

## Resolution

Registration now requests `emailRedirectTo: dinner2://confirm`, so Supabase Auth's confirmation email returns the user to the app's deep link. The app handles the link on a new `/confirm` route: it reads the initial URL (and warm `url` events) via `expo-linking` and posts it to `POST /api/v1/auth/confirm-email`. The API extracts the session `access_token` from the URL fragment, validates it with `supabase.auth.getUser` (anon key), and rejects invalid/expired tokens (`INVALID_CONFIRMATION_LINK` 400) and unconfirmed Supabase users (`EMAIL_NOT_CONFIRMED` 422). On success it records `emailConfirmedAt` on the application `User` (new nullable Prisma field) and returns the shared `ConfirmEmailResponse`; a missing application user maps to `USER_NOT_FOUND` 404. The shared contracts also carry `emailConfirmedAt` in `RegisterResponse` (null at sign-up), so confirmed/unconfirmed states are distinguishable by the API from registration onward. The register success screen now explicitly instructs the user to check their inbox and click the confirmation link, and the confirm screen presents success, error, and missing-link states. Confirmation is enforced because the API never auto-confirms and Supabase's "Confirm email" setting applies in development and production. Tests cover shared Zod schemas, `AuthService.confirmEmail` (valid link, missing/invalid token, unconfirmed user, missing user), HTTP-level e2e for `/auth/confirm-email`, mobile `apiClient.confirmEmail` and `confirmEmailViaLink`, the `/confirm` screen (cold start, warm event, no link), and the updated register message. Typechecking, linting, formatting, tests, and builds all pass.
