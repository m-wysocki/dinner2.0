# 25: i18n for the AI-assisted creation flow

**What to build:** Polish and English translations for the create and review screens of AI-assisted creation, including loading and failure/retry states, with key parity enforced and covered by tests.

**Blocked by:** 24: Mobile create-to-review flow

**Status:** ready-for-agent

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

- [ ] All new create/review/failure strings exist in PL and EN with key parity.
- [ ] Extraction loading and retry states are localized.
- [ ] i18n unit tests pass (key parity, interpolation); workspace typecheck, lint, and format pass.