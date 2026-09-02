# 34: AI review screen migration completion

**What to build:** The AI-assisted create-and-review screen finishes its migration to the reusables primitives: any remaining StyleSheet-styled fragments (pasted source text display, review lists, extracted ingredient rows) adopt token-based className styling.

**Blocked by:** 33: Recipe editing screen migration

**Status:** ready-for-agent

## Definition of done

- [ ] No StyleSheet usage remains on the review screen; all fragments use className styling with theme tokens.
- [ ] The screen shares the migrated recipe form primitives where forms appear.
- [ ] Existing review screen tests pass (updated to the new markup where needed).
- [ ] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- This screen was the ticket-26 pilot; this ticket sweeps the remainder so no screen still mixes StyleSheet and className styling.
