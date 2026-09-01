# AI-assisted ingredient identity matching against catalog slugs

**Status:** accepted, supersedes ADR-0003

**Date:** 2026-08-29

## Context

Recipe extraction (`POST /api/v1/recipes/extract`) returns ingredient names as free text, and
the server resolves each name deterministically against the ingredient catalog by normalized
`namePl`/`nameEn` exact match. The deterministic matcher fails on any variant it does not know
verbatim — a one-letter difference (`marchewka` vs `marcheweczka`), a diminutive, a synonym, or
a grammatical form — and the name becomes a custom proposal. The user must then either create a
duplicate catalog entry or manually remap, which pollutes the catalog over time.

The catalog exposes a stable unique `slug` per entry. The user asked that the AI match ingredient
names semantically against the known slug list, recognizing variants the deterministic matcher
cannot.

ADR-0003 stated that identity resolution is "deterministic on the server rather than delegated
to the model". This ADR overturns that decision for the parts of identity matching that require
semantic understanding, while keeping a deterministic first pass.

## Decisions (grilled, Q1–Q12)

1. **Two-pass flow.** Pass 1 is the unchanged extraction. Pass 2 feeds the extracted names plus
   the full list of active slugs (system + the user's custom entries) to the AI and reads back
   per-name assignments.
2. **AI is the authority.** The AI returns one `slug` (from the provided list) or `null`. The
   server only validates that the slug exists in the provided list; it does not second-guess the
   semantic match.
3. **Return shape.** Each unmatched name resolves to a single `slug` or `null`, plus a
   `bestCandidate` (the closest slug) used only when `slug` is null.
4. **List scope.** All active entries for the requesting user (system + custom), no pre-filter.
5. **Uncertainty bias is expansive.** The AI prefers assigning a slug when the match is
   plausible; `null` + `bestCandidate` is reserved for names with no credible candidate. This
   prevents duplicate catalog entries.
6. **Deterministic matcher runs first.** The existing normalized-name matcher still resolves the
   names it knows exactly; the AI pass runs only for the remaining unmatched names (cost and
   latency control).
7. **`bestCandidate` is surfaced to review.** In the review step the candidate is pre-selected:
   one click links the ingredient to the existing entry; a separate action creates a new custom
   entry from the raw name.
8. **Failure fallback.** If the AI pass throws (timeout, provider error, bad schema), the
   deterministic results stand and unmatched names become plain proposals without
   `bestCandidate`. Extraction never fails because of the matching pass.
9. **Model and seam.** The matching pass uses `gpt-4o-mini` (cheap one-of-N classification),
   invoked through the same `RecipeExtractionProvider` abstraction as extraction, synchronously
   in the same request.
10. **Matching prompt semantics.** Identity matching, not translation — the slug language may
    differ from the source name (`mąka` → `flour`). Custom slugs are Polish and owner-suffixed;
    the AI matches them literally from the list.
11. **Testing.** Unit tests cover the orchestrator (only unmatched names reach the AI, returned
    slugs/`bestCandidate` are validated against the list, failure falls back) and integration
    uses a mocked provider. No real-provider e2e.
12. **Docs.** This ADR supersedes ADR-0003.

## Consequences

- The extract draft carries an additional `bestCandidate` per ingredient, consumed by the review
  step.
- Server-side validation is preserved: a hallucinated slug is dropped, and `bestCandidate` is
  only accepted when it is a real catalog slug.
- Results are no longer fully deterministic, but the deterministic first pass plus strict list
  validation bound the AI's authority to names the matcher could not resolve anyway, and the
  human review step remains the final safety net.
- One extra provider call adds latency and cost per extraction with unmatched ingredients.