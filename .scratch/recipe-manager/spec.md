# Recipe Manager: first vertical slice

Status: ready-for-agent

## Problem Statement

The project currently exists as a broad product idea without an executable foundation. The first implementation must establish a secure, multi-user recipe workflow with AI-assisted recipe creation from pasted text, without prematurely building media imports, shopping lists, or other future features.

## Solution

Build a mobile-first recipe manager with a React Native/Expo client and an independent NestJS REST API. The first vertical slice lets an email-authenticated and administrator-activated user create recipes by pasting a title and recipe text, review the AI-extracted structure, and list, view, edit, and delete private recipes with structured ingredients and a single description that covers the full preparation.

The application supports Polish and English interface languages from the beginning, with Polish as the default. Supabase provides hosted PostgreSQL and authentication infrastructure. The mobile client communicates with application data only through the NestJS API.

## User Stories

1. As a new user, I want to register with an email address and password, so that I can create a private recipe collection.
2. As a registered user, I want to confirm my email address, so that the application can verify ownership of my account.
3. As an administrator, I want new accounts to start in a pending state, so that unapproved users cannot access private application data.
4. As an approved user, I want to log in and remain logged in across app launches, so that I do not need to authenticate repeatedly.
5. As an authenticated user with a pending account, I want to see why access is unavailable, so that I understand that activation is still required.
6. As an authenticated user, I want to log out, so that another person cannot use my session.
7. As an authenticated user, I want to create a recipe manually, so that I can store a recipe without importing it.
8. As a user creating a recipe, I want to enter a title, so that I can identify the recipe.
9. As a user creating a recipe, I want to enter an optional description, so that I can capture useful context.
10. As a user creating a recipe, I want to set the serving count, so that ingredient quantities have a defined basis.
11. As a user creating a recipe, I want to add ingredients with names, quantities, units, notes, and order, so that recipes are structured rather than arbitrary text.
12. As a user creating a recipe, I want to leave a quantity empty for an expression such as “to taste”, so that recipes do not require artificial numeric values.
13. As a user creating a recipe, I want to choose a canonical ingredient identity, so that equivalent ingredients can later be merged in shopping lists.
14. As a user creating a recipe, I want to create a custom ingredient when the catalog has no suitable match, so that I am not blocked by the catalog.
15. As a user creating a recipe, I want to edit an automatically suggested ingredient identity before saving, so that the stored identity is accurate.
16. As a user creating a recipe, I want the description to capture the complete preparation in a single readable text, so that the cooking method is part of the recipe without being split into separate steps.
17. As a user, I want invalid or incomplete recipe data to be identified before saving, so that the database contains only valid recipes.
18. As a user, I want a recipe and all its ingredients to save atomically, so that I never see a partially saved recipe.
19. As an authenticated user, I want to see my recipe collection sorted from newest to oldest, so that recent recipes are easy to find.
20. As a user with no recipes, I want a useful empty state with a create action, so that I know how to begin.
21. As an authenticated user, I want to view recipe details, so that I can use a saved recipe while cooking.
22. As an authenticated user, I want to edit my recipe, so that I can correct or improve it.
23. As an authenticated user, I want to delete my recipe, so that I can remove recipes I no longer need.
24. As a user, I want my recipes to be private, so that other users cannot read or modify them.
25. As a user, I want interface labels and messages in Polish or English, so that I can use the application in my preferred language.
26. As a user, I want Polish to be the default interface language, so that the initial experience matches the primary audience.
27. As a user, I want to switch the interface language, so that I can use the application in English when needed.
28. As a user, I want recipe content to remain in the language in which I entered it, so that my manually written content is not unexpectedly changed.
29. As a user creating a recipe, I want to paste a complete recipe as text with only a title and serving count, so that I can save a structured recipe with minimal effort.
30. As a user creating a recipe, I want the AI to extract ingredients, quantities, units, and a single clean description covering the preparation from my pasted text into the application's structure.
31. As a user creating a recipe, I want to review and correct the extracted recipe before it is saved, so that AI errors never reach my collection unreviewed.
32. As a user creating a recipe, I want unmatched ingredients to appear as proposed custom identities that I can accept or remap to the catalog, so that the stored identity is accurate.
33. As a user, I want extraction to fail loudly without saving anything when the AI output cannot be validated, so that the database contains only valid recipes.
34. As a user, I want my pasted recipe text shown in the review step for comparison, and retained with the recipe afterwards, so that I can verify the extraction against the original.
35. As a user, I want the extracted content to remain in the language I pasted it in, so that my recipe is never translated.

## Implementation Decisions

### Architecture

- Use a pnpm workspace monorepo containing a mobile application, a NestJS API, and a small shared package.
- Use React Native, Expo, TypeScript, Expo Router, and TanStack Query for the mobile application.
- Use Node.js, NestJS, TypeScript, REST, Prisma, and PostgreSQL for the API.
- Use Supabase for hosted PostgreSQL and Supabase Auth from the beginning.
- The mobile application never accesses PostgreSQL or application tables directly.
- The NestJS API is the application boundary for authentication checks, validation, ownership, and persistence.
- The shared package contains stable domain contracts and Zod schemas only; it does not depend on NestJS, Prisma, or React Native.
- Use `/api/v1` as the REST prefix and expose an OpenAPI contract.

### Authentication and access

- Supabase Auth is the source of login identity and email confirmation.
- The application database has its own user record linked to the Supabase Auth user ID.
- The application user record stores access status and preferred interface language.
- New users begin with `PENDING` access.
- Access to application data requires both confirmed email and `ACTIVE` application status.
- During the initial implementation, an administrator changes access status manually in the database. An activation panel is out of scope.
- The API derives the user ID from the verified JWT and never trusts a user ID supplied by the client.
- Email confirmation is required in development and production.
- Users with pending access can authenticate but cannot access recipe data.

### Domain and data model

- A `User` owns private recipes and custom ingredient identities.
- A `Recipe` contains an owner, title, optional description, serving count, timestamps, and ordered child ingredients. The description carries the full preparation method in plain text.
- A `RecipeIngredient` belongs to one recipe and stores a canonical ingredient reference, name snapshot, optional decimal quantity, canonical unit, optional note, and order.
- An `IngredientCatalogEntry` represents a canonical ingredient identity with localized Polish and English display names, an active state, and whether it is a system or custom entry.
- System catalog entries are shared; custom entries are owned by one user.
- A saved recipe ingredient must have a user-confirmed canonical ingredient identity.
- A recipe ingredient retains a name snapshot so catalog renames do not rewrite historical recipes.
- Quantities use precise decimal storage. Display formatting, fractions, and localized labels belong to the client.
- Canonical units are language-independent values such as `G`, `KG`, `ML`, `L`, `PCS`, `TSP`, `TBSP`, and `OTHER`.
- IDs for application entities use UUIDs.
- Used catalog entries are not physically deleted; future administration may deactivate or merge them.
- Recipe deletion is permanent in the first vertical slice.
- Recipe creation and updates persist the recipe and its ingredients atomically.

### API shape

The first vertical slice should provide these resource operations:

- `GET /api/v1/auth/me`
- `GET /api/v1/recipes`
- `POST /api/v1/recipes`
- `GET /api/v1/recipes/:id`
- `PATCH /api/v1/recipes/:id`
- `DELETE /api/v1/recipes/:id`
- `POST /api/v1/recipes/extract`
- `GET /api/v1/ingredient-catalog`
- `POST /api/v1/ingredient-catalog/custom`

All recipe endpoints require authentication and enforce ownership in the backend. The list is initially newest-first with a server-side maximum result count and no search, filters, or pagination contract. API errors use a predictable shape containing a machine-readable code, a safe message, and optional validation details.

### AI-assisted creation

- Recipe creation collects a title, recipe source text, and serving count; the structured form is used only when editing an existing recipe.
- `POST /api/v1/recipes/extract` returns a validated, non-persisted draft; saving happens only through `POST /api/v1/recipes` after user review.
- The AI call is isolated behind a provider abstraction in the API; OpenAI is the first provider and the API key never reaches the client.
- The AI extracts ingredient names, quantities, units, and a single clean description that includes the full preparation; the name excludes size and quality descriptors (moved to the ingredient note), and approximate or range amounts such as "do 300 g" still yield a numeric quantity; the server resolves canonical identities deterministically against the catalog using both Polish and English display names.
- Ingredient units map to canonical units when possible; unrecognized units use `OTHER` and preserve the original text in the ingredient note.
- Unmatched ingredients are presented in review as proposed custom identities; every ingredient in review offers both actions — saving it as a new custom identity or remapping it to an existing catalog entry — and custom entries are created only when the user confirms them.
- The description produced by the AI covers the complete preparation in the language of the source text, never as separated numbered steps; extraction output is validated with Zod before it is returned.
- Extraction keeps the language of the pasted text; content is never translated.
- Failed or invalid extraction returns a loud, retryable error and never persists anything.
- The recipe source text is stored with the recipe for provenance and is shown during review for comparison; it is not displayed as recipe content on the details screen.

### Mobile navigation

The first authenticated shell contains:

- recipe list;
- create recipe (title, recipe source text, serving count, then review of the extracted draft);
- recipe details;
- edit recipe (full structured form);
- account pending/activation state;
- language selection.

Home dashboard, shopping lists, collections, favorites, search, and filtering are not part of this slice.

### Language behavior

- Interface language supports Polish and English from the beginning, with Polish as default.
- User-entered recipe content is not automatically translated in the manual workflow.
- Future imports retain source representation and can create a structured version in the user's preferred interface language.
- Imported content must be reviewed before saving.
- Canonical ingredient identity remains language-independent and is separate from display names.

### Testing seam

The primary test seam is the REST API boundary: HTTP request, JWT authentication, validation, ownership rules, domain behavior, Prisma persistence, and HTTP response. Shared Zod schemas and pure domain calculations receive focused tests. Mobile tests focus on observable screen behavior and API contract usage rather than component internals.

### Development order

0. Create the GitHub repository, initialize Git, and configure a safe `.gitignore`.
1. Repository foundation, workspace tooling, TypeScript, linting, formatting, environment validation, Supabase connection, and CI.
2. Authentication integration, application user record, email confirmation, pending/active access checks, session persistence, and authenticated mobile shell.
3. Recipe, recipe ingredient, and ingredient catalog schema with seed data.
4. Recipe API with ownership checks and integration tests.
5. Mobile recipe list, empty state, create form, details, edit, and delete flows.
6. Ingredient identity selection/custom creation, quantity and unit editing, and validation.
7. Web as the source of truth for platform verification: web renderer screen tests and a web export build step in CI.
8. AI-assisted creation: extract endpoint, provider abstraction with OpenAI, deterministic catalog resolution, review-before-save, and the create screen rewrite.
9. Automated scaling behavior for serving counts.
10. Image and media support.
11. Photo/OCR importer, then URL, YouTube, voice, and Instagram integrations.
12. Search and organization.
13. Shopping lists and ingredient merging.

The first implementation task is repository foundation only. It must end with a runnable mobile app, runnable API, configured Supabase connection, shared package, basic checks, and CI. It must not implement recipes or authentication behavior yet.

## Testing Decisions

- Tests verify observable behavior at the highest practical seam and do not assert private implementation details.
- API integration tests cover authentication gates, pending versus active access, recipe CRUD, validation, atomic persistence, and recipe ownership isolation.
- Unit tests cover shared Zod schemas, canonical unit validation, ingredient identity rules, and later deterministic serving scaling.
- Mobile tests cover authenticated/pending routing, empty recipe state, create/edit validation, successful save, and API error presentation.
- Contract tests ensure mobile requests and API responses conform to the shared schemas and OpenAPI contract.
- Each implementation task must run its relevant tests, type checking, linting, and build or runtime verification.
- There is no existing test prior art; the foundation task must establish the test commands and conventions for the monorepo.

## Out of Scope

- OCR, speech-to-text, scraping, URL imports, YouTube imports, Instagram imports, translation of imported content, and AI providers other than the OpenAI-backed extraction provider.
- Recipe images, camera access, audio, object storage, and media processing.
- Shopping lists, ingredient merging workflows, search, filters, sorting controls, collections, favorites, and meal planning.
- Social login, password reset UX, administrator panel, invitation system, and automated administrator email notifications.
- Account deletion, public recipes, sharing, household access, and collaboration.
- Offline mode, synchronization conflict resolution, and multi-device conflict handling.
- Full ingredient taxonomy administration, ingredient merge UI, and nutrition data.
- Production deployment and a separate production Supabase project.

## Further Notes

- Supabase Auth email confirmation and application-level activation are intentionally separate states.
- Manual database activation is an initial operational shortcut, not the desired final administrator workflow.
- The first vertical slice should remain small enough to implement and verify in one agent session per ticket.
- Future import pipelines must preserve the separation between raw input, structured extraction, validation, normalization, user review, and persisted recipe data.
- The `CONTEXT.md` glossary and ADRs are the source of truth for domain terminology and architectural rationale.
