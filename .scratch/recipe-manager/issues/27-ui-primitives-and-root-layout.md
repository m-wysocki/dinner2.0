# 27: UI primitives and root layout migration

**What to build:** All UI primitives the remaining screens need are available through React Native Reusables, and the root layout (navigation header, theme wiring) is styled with className-based tokens instead of StyleSheet.

**Blocked by:** None (can start immediately)

**Status:** resolved

## What to do

- Add the missing reusables primitives the remaining screens need (input, card, label, separator, and any others discovered while surveying the screens) via the reusables CLI.
- If a new primitive enters the test graph, add the same vitest alias pattern used for the slot primitive.
- Migrate the root layout screen to className styling with theme tokens; keep navigation theme behavior unchanged.

## Definition of done

- [x] Every primitive needed by screens 28–34 imports from `components/ui`.
- [x] Root layout uses className-based styling; navigation still renders correctly on web and iOS.
- [x] `apps/mobile` typecheck, lint, and tests pass; web bundle builds through metro.

## Comments

- Prefactor ticket: makes the per-screen migrations mechanical. Survey all screens first so the primitive set is added once, not per ticket.
- Screen survey result: the screens need `input`, `label`, `card`, and
  `toggle-group` (unit selector / ingredient-catalog chips in `recipe-form`).
  `separator` was added per the ticket text but no screen currently uses it.
  No `Switch`/`Checkbox`/`Select`/`Dialog`/`Avatar` usage exists anywhere; the
  delete confirmation in `recipes/[id]` is an inline panel, not a `Modal`.
- Added via the reusables CLI: `input`, `label`, `separator` and, in a second
  run, `card`, `toggle`, `toggle-group`, `icon` (toggle-group pulls toggle and
  icon). The CLI interactively prompts to overwrite existing `text.tsx`; move
  the file aside, run with `-y -o`, then restore the original.
- New deps: `@rn-primitives/label`, `@rn-primitives/separator`,
  `@rn-primitives/toggle`, `@rn-primitives/toggle-group`.
- **None of the new primitives enter the vitest test graph yet** (only
  `review.tsx` imports `components/ui`, and tests render screens directly, not
  `_layout`). The slot stub in `vitest.config.ts` was therefore NOT extended.
  Tickets 28–34 must add the same alias for `@rn-primitives/label`,
  `@rn-primitives/separator`, `@rn-primitives/toggle`, and
  `@rn-primitives/toggle-group` the moment a migrated screen is rendered by a
  test (they ship the same untranspiled-JSX dists as `slot`).
- Root layout was already className-based from ticket 26 (LoadingScreen uses
  tokens, `NAV_THEME` wired, `headerShown: false`). The remaining hardcode —
  the loading spinner's `hsl(147, 48%, 30%)` — now reads `THEME[..].brand`
  from `lib/theme.ts`, so the layout has no duplicated color literals.
