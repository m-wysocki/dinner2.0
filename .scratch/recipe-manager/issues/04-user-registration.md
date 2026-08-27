# 04: User registration

**What to build:** A person can register with email and password and receive a pending application account.

**Blocked by:** 02: API bootstrap and Supabase configuration; 03: Mobile bootstrap and API client

**Status:** resolved

- [x] Invalid registration data is rejected with safe, predictable errors.
- [x] Supabase Auth registration is invoked by the API/application flow.
- [x] A linked application user is created with `PENDING` access.
- [x] The mobile UI presents success and failure states.

## Resolution

Added `POST /api/v1/auth/register`, which validates the body with a shared Zod schema, calls Supabase Auth `signUp`, and creates an application `User` linked to the Supabase auth ID with `PENDING` access (new `User` model and `AccessStatus` enum in Prisma). A global exception filter returns the shared `{ error: { code, message, details? } }` shape; duplicate emails map to a safe `EMAIL_ALREADY_REGISTERED` 409. The mobile app gains a register screen with client-side validation, success (pending activation) and failure states, and a `register` API client method that surfaces the server's safe message. Tests cover shared Zod schemas, the auth service/controller/pipe/filter, HTTP-level e2e (Nest testing module with mocked Supabase and Prisma; SWC transform added for decorator metadata), and mobile API contract usage. Typechecking, linting, formatting, tests, and builds all pass.
