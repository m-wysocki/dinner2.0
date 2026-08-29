# 24: Mobile create-to-review flow for AI-assisted creation

**What to build:** The create recipe screen collects title, recipe source text, and serving count; calls `POST /api/v1/recipes/extract`; shows the extracted draft in a review step where the user corrects it (including accepting/remapping proposed custom identities) and saves through the existing `POST /api/v1/recipes`.

**Blocked by:** 21: Web as the source of truth; 22: Recipe extraction endpoint; 23: Catalog resolution for drafts

**Status:** resolved

## Background

Q3/Q5 decisions (grill-with-docs): recipe creation is limited to `title` + `sourceText` + `servingCount`; the full structured form lives only in editing. The paste text is stored as provenance (`sourceText`) and is not shown on the recipe details screen. Extraction failures must fail loudly with a retry and never persist.

## What to do

- **API client** (`apps/mobile/src/api/client.ts`): add `extractRecipe({ title, sourceText, servingCount })` returning the draft, typed from the shared schemas.
- **Create screen rewrite** (`apps/mobile/app/create-recipe.tsx`): inputs for title, multiline source text (large limit, ~20k), and serving count. Submit calls `extractRecipe`; show a loading state; on failure show a loud, localized error with a retry action and keep the user's input intact.
- **Review step** (new route, e.g. `/create-recipe/review`): present the draft in an editable structured form — reuse `RecipeForm` (`apps/mobile/src/recipe/recipe-form.tsx`) populated from the draft. For proposed custom identities, render them so the user can either accept (creating a custom entry via the existing `POST /api/v1/ingredient-catalog/custom`) or remap to an existing catalog chip. Confirm submits the corrected recipe via the existing `POST /api/v1/recipes`.
- **RecipeForm support**: extend it (if needed) to render and resolve proposed custom identities from a draft, and to accept a draft as `initialValues`.
- **Details screen** (`apps/mobile/app/recipes/[id].tsx`): ensure `sourceText` is never rendered; no behavior change otherwise.
- **Tests** (web renderer, per ticket 21): create screen extraction call + failure/retry, review save flow, proposal accept/remap, and no `sourceText` on details.

## Definition of done

- [x] Create screen sends `{ title, sourceText, servingCount }` to the extract endpoint and shows the result in a review step.
- [x] Extraction failure shows a loud localized error with retry and keeps user input.
- [x] Review lets the user edit the draft and accept/remap proposed custom identities before saving.
- [x] Save goes through the existing recipe create endpoint; `sourceText` is stored but never rendered on details.
- [x] Web-renderer tests cover create, failure/retry, review, and proposal handling; workspace typecheck, lint, and format pass.