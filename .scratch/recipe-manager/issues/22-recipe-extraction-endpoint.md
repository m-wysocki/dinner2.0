# 22: Recipe extraction endpoint and OpenAI provider

**What to build:** A guarded `POST /api/v1/recipes/extract` endpoint that turns pasted recipe text into a validated, non-persisted draft, using an AI provider abstraction with OpenAI as the first provider.

**Blocked by:** 21: Web as the source of truth

**Status:** resolved

## Background

Recipe creation now happens through AI-assisted creation: the user enters a title, the full recipe text (`sourceText`), and a serving count; the API extracts a structured draft that the user reviews before saving (see `CONTEXT.md` "AI-assisted recipe creation", ADR-0003, `spec.md`). The AI key must never reach the client, so the extraction lives in the API behind a thin provider abstraction.

## What to do

- **Shared package** (`packages/shared/src/index.ts`): add
  - `extractRecipeRequestSchema`: `{ title: string 1..200, sourceText: string 1..20000, servingCount: int 1..1000 }`;
  - `extractRecipeDraftSchema`: `{ title, description (short, AI-generated, same language as the source text), servingCount, ingredients: [{ name, quantity (decimal|null), unit (canonicalUnit), note (string|null), position }], preparationSteps: [{ text, position }] }`. Ingredient identity fields (`catalogEntryId` / custom proposal) are added by ticket 23.
- **Provider abstraction** (`apps/api/src/ai/`): an injectable `RecipeExtractionProvider` interface (`extractRecipe(input): Promise<ExtractedRecipe>`) and an `OpenAiRecipeExtractionProvider` implementation that uses OpenAI structured outputs (JSON schema) constrained to the canonical unit enum and the draft shape. Add `OPENAI_API_KEY` to `apps/api/.env.example` and the config module; never expose the key through any response.
- **Endpoint**: `POST /api/v1/recipes/extract` under the existing recipes guards (auth + active access), body validated via `ZodValidationPipe`. It calls the provider, validates the provider output with Zod, and returns the draft. It **must not persist anything**.
- **Unit mapping**: the extraction prompt maps recognizable units to the canonical enum (`G, KG, ML, L, PCS, TSP, TBSP, OTHER`); for anything unrecognized (e.g. "szklanka") it must emit `OTHER` and keep the original text in the ingredient `note`.
- **Description**: the AI produces a clean, short description from the source text, in the language of the source text. No translation of content.
- **Failure behavior**: provider or validation failure returns a predictable, retryable error (machine-readable code, safe message — reuse the existing error shape) and never persists; the client will offer retry.
- **Tests**: shared schema unit tests; API unit tests for the provider (mocked OpenAI/fetch) and an e2e test for the endpoint with the provider mocked, covering validation failure, unit fallback to `OTHER` + note, and the guarantee that nothing is written.

## Definition of done

- [ ] `POST /api/v1/recipes/extract` returns a Zod-validated draft for `{ title, sourceText, servingCount }` and never persists anything.
- [ ] OpenAI provider sits behind the `RecipeExtractionProvider` abstraction; the key is server-side only.
- [ ] Unrecognized units become `OTHER` with the original text preserved in `note`.
- [ ] Extraction failure returns a loud, retryable error and nothing is saved.
- [ ] Shared, unit, and e2e tests pass; workspace typecheck, lint, and format pass.