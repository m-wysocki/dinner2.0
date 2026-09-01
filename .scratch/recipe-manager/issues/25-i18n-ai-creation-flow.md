# 25: i18n for the AI-assisted creation flow

**What to build:** Polish and English translations for the create and review screens of AI-assisted creation, including loading and failure/retry states, with key parity enforced and covered by tests.

**Blocked by:** 24: Mobile create-to-review flow

**Status:** resolved

## What to do

- Extend `apps/mobile/src/i18n/translations.ts` (PL and EN, keeping key parity) for:
  - create screen: title, source text (hint that it should contain ingredients and steps), serving count labels;
  - extraction progress state (e.g. "AI przetwarza przepis…");
  - extraction failure and retry messages;
  - review step: proposed custom identity labels ("nowy składnik", accept/remap), unit labels as needed;
  - any new recipe-form strings introduced by ticket 24.
- Follow the existing conventions: typed dictionaries with compile-time and test-enforced key parity, `translate` helper with interpolation, Polish-aware pluralization where applicable.
- Update screen tests from ticket 24 where assertions reference labels; verify both languages.

## Definition of done

- [x] All new create/review/failure strings exist in PL and EN with key parity.
- [x] Extraction loading and retry states are localized.
- [x] i18n unit tests pass (key parity, interpolation); workspace typecheck, lint, and format pass.

## Comments

- Ticket 24 had already routed the create/review screens through `t()`, so the
  remaining work was copy and coverage: the source-text placeholder now asks
  for the full recipe with ingredients and preparation steps, the extraction
  loading state reads "AI przetwarza przepis..." / "AI is processing the
  recipe...", and the proposal panel gained a dedicated badge label
  `review.proposalLabel` ("Nowy składnik" / "New ingredient") above the
  existing interpolated `review.proposalText`.
- Fixed an English-interface bug from ticket 24: the proposal panel always
  interpolated `customProposal.namePl`; it now picks `nameEn` when the
  interface language is English, matching the catalog chips.
- Both languages are now covered by screen tests, not just the dictionaries:
  the create screen test renders an English session and asserts labels, the
  hint placeholder, the AI loading state, and the localized failure/retry
  path; the review screen test verifies the English proposal badge, the
  English proposal name, remap to an English catalog chip, and the localized
  saved message. The PL loading state is asserted via a deferred extraction
  promise.
- `translations.test.ts` gained an explicit interpolation assertion for
  `review.proposalText` in both languages; key parity stays compile-time
  (`Record<TranslationKey, string>`) and test-enforced.
- Post-review cleanup: the `useI18n` test mock now lives in
  `apps/mobile/test/i18n-mock.ts` (shared by the create and review screen
  tests; the language screen keeps its own variant because it asserts on a
  shared `setLanguage` mock), and recipe-form gained a `localizedName` helper
  used by both the proposal panel and the catalog chips.