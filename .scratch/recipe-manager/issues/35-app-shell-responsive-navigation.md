# 35: App shell with responsive navigation

**What to build:** The app gains a shared shell: on desktop (md breakpoint and up) a left sidebar with navigation, on mobile a bottom tab bar. Navigation has three destinations — Recipe collection (home), Add recipe, and Account — identical on desktop and mobile. Screen content sits in a top-aligned container with a centered max width on desktop, replacing the current vertically centered layout. Every screen renders through the shell.

**Blocked by:** None (can start immediately)

**Status:** resolved

## Definition of done

- [x] Desktop shows a left sidebar with the three navigation destinations; mobile shows a bottom tab bar with the same three destinations.
- [x] The active destination is visually highlighted in both sidebar and tab bar.
- [x] Screen content is top-aligned and constrained to a centered max-width container on desktop; the old vertical centering is gone.
- [x] All current screens (collection, create/review, details, edit, account) render inside the shell.
- [x] Layout verified on both narrow (mobile) and wide (desktop/web) viewports.
- [x] `apps/mobile` typecheck, lint, and tests pass (existing tests updated to the new markup).

## Comments

-
