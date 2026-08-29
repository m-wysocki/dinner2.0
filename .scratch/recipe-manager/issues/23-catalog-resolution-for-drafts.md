# 23: Deterministic catalog resolution for extracted drafts

**What to build:** The extract response gains per-ingredient canonical identities resolved deterministically against the ingredient catalog — a matched `catalogEntryId` or a proposed custom identity — so the AI never supplies identity, only names.

**Blocked by:** 22: Recipe extraction endpoint and OpenAI provider

**Status:** ready-for-agent

## Background

Per `CONTEXT.md` ("Canonical ingredient identity"), identity resolution is a domain rule owned by the server, not the model. Q6 decision (grill-with-docs): the AI returns ingredient names as free text; the server matches them to the catalog using both `namePl` and `nameEn`, and produces a proposed custom identity for anything unmatched. The review step (ticket 24) lets the user accept a proposal or remap to an existing entry.

## What to do

- **Resolver** (`apps/api/src/recipes/`): a deterministic service that normalizes an ingredient name (trim, lowercase, strip punctuation/quantity artifacts) and matches it against `IngredientCatalogEntry` by `namePl` and `nameEn`. It must work cross-language (e.g. "mąka" → `flour`, "flour" → `flour`), case-insensitively, and handle common trailing/punctuation noise.
- **Draft extension**: extend `extractRecipeDraftSchema` so each ingredient carries `catalogEntryId: uuid | null` and, when null, a custom proposal `{ namePl, nameEn }` (both set to the ingredient name as written in the source language — no translation). Wire the resolver into the extract endpoint (ticket 22) so the returned draft already includes identity resolution.
- **Proposal rules**: unmatched ingredients become proposals; matched ingredients reference the existing entry. The server must not create any catalog entries at extraction time — creation happens only when the user confirms (ticket 24).
- **Tests**: unit tests for the resolver (cross-language, casing, punctuation, multi-word names, custom vs system entries) and integration coverage that the extract endpoint returns both matched and proposed identities. Extend the e2e from ticket 22 accordingly.

## Definition of done

- [ ] Extract draft ingredients carry either a matched `catalogEntryId` or a custom proposal `{ namePl, nameEn }`.
- [ ] Matching is deterministic and bilingual (`namePl` + `nameEn`), with unit tests for edge cases.
- [ ] No catalog entries are created at extraction time.
- [ ] Shared, unit, and e2e tests pass; workspace typecheck, lint, and format pass.