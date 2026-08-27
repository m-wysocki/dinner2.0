# Recipe Manager — Project Specification

## 1. Project overview

Build a modern mobile-first recipe management application.

The main purpose of the application is to allow users to collect, organize, edit and use cooking recipes from different sources in one place.

A user should be able to add a recipe in several different ways:

1. Take a photo of a recipe from a cookbook or another physical source.
2. Import a recipe from a URL.
3. Import a recipe from YouTube.
4. Import a recipe from Instagram when technically and legally possible.
5. Dictate a recipe using voice.
6. Enter a recipe manually.

The application should use AI to transform unstructured input into a structured recipe containing:

* recipe title,
* description,
* ingredients,
* quantities,
* units,
* preparation steps,
* servings,
* images,
* notes,
* source information.

The application should also eventually provide a shopping-list feature where the user can select multiple recipes and generate a combined shopping list grouped by categories.

The application should initially support:

* Polish (`pl`) as the default language.
* English (`en`) as an alternative language.

The architecture should make it possible to add other languages later.

---

# 2. Main technical goal

This is not intended to be just a simple CRUD application.

The project should also serve as a portfolio project demonstrating full-stack development skills.

The architecture should therefore clearly separate:

```text
Mobile application
        ↓
REST API
        ↓
Backend
        ↓
Database / Storage / External services
```

The backend must not be tightly coupled to the mobile frontend.

In the future, the same backend should be usable by:

* React Native mobile application,
* web application,
* native iOS application,
* potentially other clients.

---

# 3. Proposed technology stack

Use the following stack unless there is a strong technical reason to change something.

## Mobile

* React Native
* Expo
* TypeScript
* Expo Router
* TanStack Query

Use native device capabilities where appropriate:

* camera,
* photo library,
* microphone,
* file system,
* sharing/deep links,
* secure storage.

The application should be a real mobile application, not a PWA.

---

## Backend

Use:

* Node.js
* NestJS
* TypeScript
* REST API
* Prisma

The backend should have a modular architecture.

Potential modules:

```text
auth
users
recipes
ingredients
imports
media
shopping
collections
ai
scraping
```

Do not create all modules immediately. Create them only when required by the implementation stage.

---

## Database

Use:

* PostgreSQL
* Prisma ORM

Supabase may be used as the managed PostgreSQL infrastructure.

The mobile application must NOT communicate directly with the database.

The intended architecture is:

```text
React Native
      ↓
NestJS REST API
      ↓
Prisma
      ↓
PostgreSQL
```

---

## Storage

Use Supabase Storage or an equivalent object-storage solution for:

* recipe images,
* uploaded cookbook photos,
* potentially audio files,
* other user-generated media.

Do not store large binary files directly inside PostgreSQL.

---

## Authentication

Use a secure authentication solution.

Supabase Auth is acceptable for the first version, but authentication must still be integrated through the backend architecture where appropriate.

Every user-owned resource must be associated with a user.

Users must never be able to access another user's private recipes, notes, images or shopping lists.

---

## Validation

Use strong runtime validation.

Prefer:

* Zod on the appropriate boundaries,
* DTO validation in NestJS,
* Prisma schema validation at the database level.

AI-generated data must NEVER be trusted blindly.

AI output must go through validation before being stored in the database.

---

# 4. Core architectural principle

The most important architectural principle is:

> Separate raw input, AI processing, normalized data and persisted application data.

For example:

```text
Photo
 ↓
OCR
 ↓
Raw text
 ↓
AI extraction
 ↓
Structured JSON
 ↓
Validation
 ↓
Normalization
 ↓
User confirmation
 ↓
Database
```

The same principle should apply to:

```text
URL
YouTube
Instagram
Voice
Manual text
```

All of them should eventually produce the same normalized recipe structure.

---

# 5. Recipe import architecture

Create the concept of a recipe import.

Possible source types:

```text
PHOTO
URL
YOUTUBE
INSTAGRAM
VOICE
TEXT
MANUAL
```

An import should have a lifecycle/status.

For example:

```text
PENDING
PROCESSING
READY_FOR_REVIEW
COMPLETED
FAILED
```

The exact implementation can be adjusted during development.

The important principle is that importing a recipe should be treated as a processing pipeline rather than a simple database insert.

---

# 6. Recipe data model

A recipe should contain structured data.

At minimum:

```text
Recipe
- id
- userId
- title
- description
- servings
- sourceType
- sourceUrl
- createdAt
- updatedAt
```

Ingredients must NOT be stored as arbitrary strings only.

Use structured ingredient data:

```text
Ingredient
- id
- recipeId
- name
- canonicalName
- quantity
- unit
- category
- order
```

The exact database model can be refined before implementation.

---

# 7. Units

Units must be normalized.

Do not allow the AI to create arbitrary unit strings such as:

```text
łyżka
łyżki
łyżek
tablespoon
tbsp
```

as completely separate internal values.

Use canonical units/enums, for example:

```text
G
KG
ML
L
PCS
TSP
TBSP
CUP
PINCH
PACK
CLOVE
HANDFUL
OTHER
```

The exact unit list should be reviewed before implementation.

The important principle is:

```text
canonical unit
      ↓
localized display
```

For example:

```text
TBSP
```

can be displayed as:

```text
PL → łyżka / łyżki
EN → tablespoon / tablespoons
```

The database should store the canonical representation, not the localized text.

---

# 8. Servings

Every recipe should have a number of servings.

Example:

```text
Recipe:
servings = 4
```

If the user changes the number of servings to 2, ingredient quantities should be recalculated.

Example:

```text
4 servings

500 g flour
2 eggs
250 ml milk
```

becomes:

```text
2 servings

250 g flour
1 egg
125 ml milk
```

The scaling logic should be deterministic and handled by application code, not by AI.

---

# 9. Shopping list — planned feature

The shopping list is an important future feature and the database architecture should not prevent it.

The intended flow:

```text
User selects multiple recipes
        ↓
Chooses desired servings for each recipe
        ↓
Application calculates ingredient quantities
        ↓
Ingredients are normalized
        ↓
Duplicate ingredients are merged
        ↓
Ingredients are grouped by category
        ↓
Shopping list is created
```

Example:

Recipe A:

```text
200 g flour
```

Recipe B:

```text
300 g flour
```

The shopping list should ideally contain:

```text
500 g flour
```

instead of two separate entries.

However:

```text
200 g wheat flour
300 g almond flour
```

must remain separate.

This is why `canonicalName` / normalized ingredient identity is important.

---

# 10. Shopping categories

Shopping-list items should eventually support categories such as:

```text
VEGETABLES
FRUIT
MEAT
FISH
DAIRY
EGGS
BAKERY
GRAINS
PASTA
CANNED
FROZEN
SPICES
SAUCES
BEVERAGES
OTHER
```

The exact taxonomy can be refined later.

The category should be represented internally as a canonical value and translated in the UI.

---

# 11. Internationalization

The application must support:

```text
PL
EN
```

Polish is the default language.

The user must be able to switch language in settings.

Do not hard-code user-facing strings directly inside components.

Use an i18n system.

For example:

```text
recipe.ingredients
recipe.preparation
recipe.servings
recipe.addRecipe
shoppingList.title
shoppingList.add
settings.language
```

The architecture should allow adding more languages later.

Ingredient names, units and categories should also be designed with localization in mind.

---

# 12. Recipe images

A recipe can contain one or more images.

Images can come from:

* cookbook photo,
* imported source,
* uploaded photo,
* user-selected image.

Images should be stored in object storage rather than directly in PostgreSQL.

The database should store metadata and references to the stored files.

---

# 13. Notes

Users should eventually be able to add personal notes to recipes.

Examples:

```text
"Next time use less salt."

"Works better with 200 ml of cream."

"Use the oven at 190°C instead."
```

These notes belong to the user and must be private.

---

# 14. Importing from a physical recipe

Expected flow:

```text
User opens Add Recipe
        ↓
Selects Scan Recipe
        ↓
Camera opens
        ↓
User takes photo
        ↓
Photo is uploaded
        ↓
OCR extracts text
        ↓
AI structures the recipe
        ↓
Application displays extracted recipe
        ↓
User reviews and edits it
        ↓
User saves recipe
```

Important:

The user must always have an opportunity to review AI-generated data before it becomes a saved recipe.

---

# 15. URL import

Expected flow:

```text
User selects Import from URL
        ↓
Pastes URL
        ↓
Backend retrieves/processes source
        ↓
Extract recipe information
        ↓
AI normalizes the recipe
        ↓
User reviews result
        ↓
Save
```

Do not assume every website can be scraped.

The implementation must account for:

* websites with structured recipe metadata,
* websites without structured metadata,
* websites that block scraping,
* invalid URLs,
* inaccessible content.

Use structured metadata such as Schema.org recipe data whenever available before relying on more fragile scraping.

---

# 16. YouTube import

Expected flow:

```text
YouTube URL
      ↓
Retrieve available metadata/transcript
      ↓
Extract recipe-related content
      ↓
AI structures recipe
      ↓
User review
      ↓
Save
```

Do not make the system depend on one specific transcript implementation if avoidable.

Design this as a separate importer.

---

# 17. Instagram import

Instagram should be treated as a separate integration.

Do not assume that arbitrary Instagram content can always be scraped.

Implement this only using technically and legally appropriate mechanisms.

If reliable automatic extraction is not possible, the application should provide a fallback workflow.

The architecture should allow Instagram support to evolve independently from other importers.

---

# 18. Voice import

Expected flow:

```text
User taps Voice
      ↓
Records recipe
      ↓
Speech-to-text
      ↓
Raw text
      ↓
AI recipe extraction
      ↓
Structured recipe
      ↓
User review
      ↓
Save
```

The speech-to-text provider should be abstracted so it can be replaced later.

---

# 19. Manual recipe creation

The user should also be able to create a recipe manually.

The manual form should support:

* title,
* description,
* servings,
* ingredients,
* quantities,
* units,
* preparation steps,
* image,
* notes.

The user must be able to add/remove/reorder ingredients and steps.

---

# 20. AI architecture

AI should be treated as an external service.

Do not scatter OpenAI API calls throughout the application.

Create a dedicated AI service/module.

For example:

```text
AiService
RecipeExtractionService
IngredientNormalizationService
```

Potential pipeline:

```text
Raw input
   ↓
AI extraction
   ↓
Structured JSON
   ↓
Schema validation
   ↓
Normalization
   ↓
Application logic
```

The AI should not directly modify the database.

---

# 21. Mobile application structure

The mobile app should eventually contain screens approximately like:

```text
Authentication
├── Login
├── Register
└── Forgot Password

Main application
├── Home
├── Recipes
├── Add Recipe
├── Shopping List
└── Settings

Recipe
├── Recipe Details
├── Edit Recipe
└── Import Review

Settings
├── Language
└── Account
```

The exact navigation structure can be refined during UX design.

---

# 22. Main implementation phases

IMPORTANT:

Do NOT implement the entire project in one step.

Break the project into small, independently testable tasks.

Each phase should be divided into even smaller tasks.

After completing a task:

1. Run the relevant tests.
2. Run type checking.
3. Run linting.
4. Verify the application.
5. Summarize what was changed.
6. Explain what should be done next.
7. Do not silently implement unrelated future features.

---

# PHASE 0 — Project planning

Before writing application code:

### 0.1

Analyze this specification.

### 0.2

Identify ambiguities and technical decisions that need to be resolved.

### 0.3

Propose the final architecture.

### 0.4

Propose the initial database schema.

### 0.5

Propose the API structure.

### 0.6

Propose the mobile navigation structure.

### 0.7

Create a development roadmap.

Do NOT start implementing everything immediately.

First present the plan.

---

# PHASE 1 — Project foundation

Set up the repository.

Recommended structure:

```text
/apps
  /mobile
  /api

/packages
  /shared
```

A monorepo is preferred if it does not introduce unnecessary complexity.

Possible tooling:

* pnpm
* Turborepo

The exact setup can be discussed before implementation.

Tasks:

### 1.1

Initialize repository.

### 1.2

Configure TypeScript.

### 1.3

Configure linting.

### 1.4

Configure formatting.

### 1.5

Configure Git hooks if useful.

### 1.6

Create mobile application.

### 1.7

Create NestJS API.

### 1.8

Create basic environment configuration.

### 1.9

Configure development database.

### 1.10

Create initial CI pipeline.

At the end of Phase 1:

```text
Mobile app runs.
API runs.
Database connection works.
Basic CI works.
```

---

# PHASE 2 — User authentication and account

This should be the first actual application feature.

Implement:

### 2.1

Registration.

### 2.2

Login.

### 2.3

Logout.

### 2.4

Session/token persistence.

### 2.5

Protected API routes.

### 2.6

Current-user endpoint.

For example:

```text
GET /auth/me
```

### 2.7

Authenticated application shell.

### 2.8

Basic account/profile screen.

### 2.9

Display information about the currently logged-in user.

### 2.10

Handle expired/invalid authentication.

At the end of this phase:

A user can create an account, log in, stay logged in and access their authenticated application.

---

# PHASE 3 — Recipe CRUD

Before AI or scraping, build the basic recipe system.

Implement:

### 3.1

Recipe database schema.

### 3.2

Ingredient schema.

### 3.3

Preparation-step schema.

### 3.4

Recipe API.

Endpoints should approximately include:

```text
GET /recipes
GET /recipes/:id
POST /recipes
PATCH /recipes/:id
DELETE /recipes/:id
```

### 3.5

Recipe list screen.

### 3.6

Recipe details screen.

### 3.7

Create recipe screen.

### 3.8

Edit recipe screen.

### 3.9

Delete recipe.

### 3.10

Ownership/security checks.

A user must never be able to access another user's recipes.

---

# PHASE 4 — Ingredients, units and servings

Implement the structured ingredient system.

### 4.1

Canonical units.

### 4.2

Ingredient quantity model.

### 4.3

Serving count.

### 4.4

Serving selector.

### 4.5

Ingredient scaling logic.

### 4.6

Unit localization.

### 4.7

Display correctly localized quantities.

### 4.8

Write automated tests for scaling.

Example:

```text
4 servings → 2 servings
500 g → 250 g
```

The calculation must be deterministic.

---

# PHASE 5 — Manual recipe creation

Create a polished manual recipe form.

Support:

### 5.1

Title.

### 5.2

Description.

### 5.3

Servings.

### 5.4

Dynamic ingredients.

### 5.5

Dynamic preparation steps.

### 5.6

Ingredient reordering.

### 5.7

Step reordering.

### 5.8

Validation.

### 5.9

Save.

### 5.10

Edit.

This creates the stable recipe foundation before introducing AI.

---

# PHASE 6 — Images and media

Implement:

### 6.1

Image upload.

### 6.2

Object storage.

### 6.3

Image metadata.

### 6.4

Recipe image display.

### 6.5

Delete/replace image.

### 6.6

Appropriate image compression/resizing.

The mobile app should not upload unnecessarily huge images.

---

# PHASE 7 — AI infrastructure

Before implementing individual importers, create the AI abstraction.

### 7.1

AI service.

### 7.2

Structured output schema.

### 7.3

Zod validation.

### 7.4

Error handling.

### 7.5

Retry strategy.

### 7.6

Token/input limits.

### 7.7

Logging.

### 7.8

Prompt/version management.

The AI must return predictable structured data.

Do not couple the entire application directly to one AI provider.

---

# PHASE 8 — Photo/OCR recipe import

Implement the first AI-powered importer.

### 8.1

Camera integration.

### 8.2

Photo upload.

### 8.3

OCR service.

### 8.4

Raw OCR result.

### 8.5

AI recipe extraction.

### 8.6

Validation.

### 8.7

Review screen.

### 8.8

User correction.

### 8.9

Save recipe.

This should be the first complete end-to-end AI pipeline.

---

# PHASE 9 — URL recipe import

Implement:

### 9.1

URL input.

### 9.2

URL validation.

### 9.3

Source retrieval.

### 9.4

Structured recipe metadata extraction.

### 9.5

Fallback extraction.

### 9.6

AI normalization.

### 9.7

Review screen.

### 9.8

Save.

---

# PHASE 10 — YouTube import

Implement:

### 10.1

YouTube URL detection.

### 10.2

Metadata retrieval.

### 10.3

Transcript retrieval.

### 10.4

Recipe extraction.

### 10.5

AI normalization.

### 10.6

Review screen.

### 10.7

Save.

---

# PHASE 11 — Voice import

Implement:

### 11.1

Microphone permissions.

### 11.2

Recording.

### 11.3

Audio upload.

### 11.4

Speech-to-text.

### 11.5

AI recipe extraction.

### 11.6

Review.

### 11.7

Save.

---

# PHASE 12 — Instagram import

Only implement this after evaluating the technically and legally appropriate integration options.

Possible fallback:

```text
Share URL
   ↓
Open application
   ↓
Try extraction
   ↓
If unavailable:
user provides text/image manually
```

The architecture should allow Instagram-specific implementation without affecting other importers.

---

# PHASE 13 — Search and organization

Implement:

### 13.1

Recipe search.

### 13.2

Filtering.

### 13.3

Sorting.

### 13.4

Collections/categories if required.

### 13.5

Favorites if required.

Do not add unnecessary organization features before the basic recipe workflow is stable.

---

# PHASE 14 — Shopping lists

Implement the shopping-list system.

### 14.1

Shopping list database model.

### 14.2

Shopping item model.

### 14.3

Select multiple recipes.

### 14.4

Select servings for recipes.

### 14.5

Generate shopping list.

### 14.6

Normalize ingredients.

### 14.7

Merge duplicate ingredients.

### 14.8

Group by category.

### 14.9

Display shopping categories.

### 14.10

Mark item as purchased.

### 14.11

Edit quantity.

### 14.12

Add custom shopping item.

### 14.13

Remove item.

---

# PHASE 15 — Internationalization

Implement:

```text
PL
EN
```

### 15.1

i18n infrastructure.

### 15.2

Polish translations.

### 15.3

English translations.

### 15.4

Language selector.

### 15.5

Persist language preference.

### 15.6

Localized units.

### 15.7

Localized categories.

### 15.8

Verify that no user-facing strings remain hard-coded.

Polish should be the default language.

---

# PHASE 16 — UX polish

After the main functionality works:

### 16.1

Loading states.

### 16.2

Empty states.

### 16.3

Error states.

### 16.4

Retry mechanisms.

### 16.5

Skeleton screens where appropriate.

### 16.6

Animations where they improve UX.

### 16.7

Accessibility.

### 16.8

Keyboard handling.

### 16.9

Responsive layouts.

### 16.10

Mobile performance.

Do not optimize prematurely before the functionality exists.

---

# PHASE 17 — Offline capabilities

This is a later phase.

Initially the app can require an internet connection.

Eventually investigate:

```text
React Native
   ↓
local database / cache
   ↓
sync engine
   ↓
REST API
```

Potentially support:

* viewing previously downloaded recipes offline,
* creating recipes offline,
* pending image uploads,
* synchronization when connection returns.

Do not implement full offline synchronization during the initial MVP unless there is a strong reason.

---

# PHASE 18 — Testing

Testing should be introduced throughout the project rather than at the end.

At minimum:

### Unit tests

Test:

* ingredient scaling,
* unit conversion where applicable,
* ingredient normalization,
* shopping-list merging,
* authentication logic,
* validation.

### Integration tests

Test:

* API endpoints,
* database interactions,
* authentication/authorization,
* recipe ownership.

### End-to-end tests

Eventually test critical flows:

```text
Register
 ↓
Login
 ↓
Create recipe
 ↓
Edit recipe
 ↓
View recipe
 ↓
Delete recipe
```

and:

```text
Import recipe
 ↓
Review
 ↓
Save
 ↓
View recipe
```

---

# 19. Security requirements

Treat security as a first-class concern.

At minimum:

* Never expose API keys to the mobile application.
* Keep AI provider keys on the backend.
* Validate all user input.
* Validate all AI output.
* Enforce user ownership on backend.
* Never trust user IDs coming from the client.
* Protect authenticated endpoints.
* Secure file uploads.
* Restrict file types and sizes.
* Do not expose private storage objects publicly without proper authorization.
* Avoid logging sensitive user data.
* Use environment variables for secrets.

---

# 20. API design principles

The API should be designed independently from the mobile UI.

Use clear REST conventions.

For example:

```text
GET    /recipes
POST   /recipes
GET    /recipes/:id
PATCH  /recipes/:id
DELETE /recipes/:id

POST   /imports
GET    /imports/:id

POST   /recipes/import/photo
POST   /recipes/import/url
POST   /recipes/import/youtube
POST   /recipes/import/voice

GET    /shopping-lists
POST   /shopping-lists
GET    /shopping-lists/:id
PATCH  /shopping-lists/:id
DELETE /shopping-lists/:id
```

The exact API should be designed before implementation of each corresponding module.

---

# 21. Development methodology

This is extremely important.

Do NOT implement large phases in a single operation.

Instead, divide every phase into small tasks.

For example, instead of:

> Implement authentication.

Use:

```text
1. Create auth module.
2. Configure provider.
3. Create user model.
4. Create registration endpoint.
5. Test registration.
6. Create login endpoint.
7. Test login.
8. Create session persistence.
9. Implement mobile login screen.
10. Connect login screen to API.
11. Handle errors.
12. Implement logout.
13. Implement protected route.
14. Test the complete flow.
```

Each task should be small enough to understand and verify independently.

---

# 22. Agent behavior

When working on this project, follow these rules:

### Rule 1

Do not implement features that were not requested for the current task.

### Rule 2

Do not skip architecture and database design.

### Rule 3

Before implementing a large feature, divide it into smaller tasks.

### Rule 4

Prefer simple solutions over unnecessary abstractions.

### Rule 5

Do not introduce a dependency unless there is a clear reason for it.

### Rule 6

Keep the backend independent from the mobile frontend.

### Rule 7

Keep external services behind abstractions where reasonable.

### Rule 8

AI output is untrusted input and must always be validated.

### Rule 9

Every user-owned resource must be protected by backend authorization.

### Rule 10

Do not implement future features prematurely.

### Rule 11

When a technical decision has multiple reasonable options, explain the trade-offs before making a significant architectural decision.

### Rule 12

After each implementation task, run relevant checks.

At minimum where applicable:

```text
typecheck
lint
tests
build
```

### Rule 13

Do not rewrite working code unnecessarily.

### Rule 14

Keep commits logically separated when possible.

### Rule 15

Document important architectural decisions.

---

# 23. Expected workflow with the developer

The project should be developed interactively.

Start by analyzing this specification.

Do NOT immediately write the whole application.

First:

1. Analyze requirements.
2. Identify missing decisions.
3. Propose architecture.
4. Propose database schema.
5. Propose API structure.
6. Propose mobile navigation.
7. Divide the roadmap into small implementation tasks.
8. Identify the first task only.

Then wait for approval before implementing the first substantial part.

After each completed task:

1. Explain what was implemented.
2. Explain files/modules changed.
3. Run appropriate validation.
4. Report test/typecheck/lint results.
5. Explain the next logical task.
6. Wait for the next instruction when appropriate.

---

# 24. MVP definition

The first usable MVP should eventually allow a user to:

```text
Register
   ↓
Login
   ↓
See their recipe collection
   ↓
Create a recipe manually
   ↓
Edit recipe
   ↓
Add recipe image
   ↓
Set number of servings
   ↓
Scale ingredients
   ↓
Import a recipe from a photo
   ↓
Review AI extraction
   ↓
Save recipe
   ↓
Import a recipe from URL
   ↓
View/search recipes
```

Then extend the MVP with:

```text
YouTube import
Voice import
Instagram import
Shopping lists
Polish / English
```

---

# 25. Future possibilities

Do not implement these now, but keep the architecture open for:

* native iOS client,
* web client,
* advanced shopping lists,
* pantry management,
* meal planning,
* weekly meal plans,
* nutritional information,
* recipe sharing,
* public recipes,
* social features,
* recipe recommendations,
* AI recipe modifications,
* "what can I cook with what I have?",
* automatic grocery-store integration,
* barcode scanning,
* household/shared recipe collections.

These are future ideas only and should NOT influence the initial implementation unless they affect a fundamental architectural decision.

---

# 26. First task

Your first task is NOT to start coding the complete application.

Instead, analyze this specification and produce:

1. Recommended final architecture.
2. Proposed monorepo structure.
3. Proposed database schema/ERD.
4. Proposed REST API structure.
5. Proposed mobile navigation.
6. Authentication approach.
7. AI/import architecture.
8. Recommended development order.
9. Potential technical risks.
10. Decisions that should be made before implementation.

Then divide Phase 1 and Phase 2 into the smallest practical implementation tasks.

Do not implement the whole project yet.

The goal is to build the application incrementally, with each step being understandable, testable and independently verifiable.
