# 27: UI primitives and root layout migration

**What to build:** All UI primitives the remaining screens need are available through React Native Reusables, and the root layout (navigation header, theme wiring) is styled with className-based tokens instead of StyleSheet.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## What to do

- Add the missing reusables primitives the remaining screens need (input, card, label, separator, and any others discovered while surveying the screens) via the reusables CLI.
- If a new primitive enters the test graph, add the same vitest alias pattern used for the slot primitive.
- Migrate the root layout screen to className styling with theme tokens; keep navigation theme behavior unchanged.

## Definition of done

- [ ] Every primitive needed by screens 28–34 imports from `components/ui`.
- [ ] Root layout uses className-based styling; navigation still renders correctly on web and iOS.
- [ ] `apps/mobile` typecheck, lint, and tests pass; web bundle builds through metro.

## Comments

- Prefactor ticket: makes the per-screen migrations mechanical. Survey all screens first so the primitive set is added once, not per ticket.
