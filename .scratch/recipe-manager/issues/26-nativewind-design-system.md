# 26: NativeWind + React Native Reusables design system

**What to build:** Install and configure NativeWind v4 with React Native Reusables (shadcn/ui-style, copy-paste components) in `apps/mobile`, port the existing hand-rolled palette into theme tokens, and migrate the create-recipe review screen as the pilot for the rest.

**Status:** resolved

## What to do

- Install NativeWind v4 (SDK 54-compatible: nativewind 4.2.x, Reanimated v4, tailwindcss 3.4.x) and wire babel/metro/tailwind/global.css.
- Set up React Native Reusables manually in the existing app (components.json, `cn` util, `lib/theme.ts` with NAV_THEME, portal host in root layout) so the CLI can add components later.
- Map the existing palette onto shadcn-style CSS variables with a dark variant: #fffaf3 background, #25352d ink, #28734a brand green, #fdf6e9/#e6d5a8 warm panel, #eef1ed muted, #a43b32 destructive, #d9ded8 borders.
- Add the reusables Button as the first component and convert `app/create-recipe/review.tsx` to className styling as the migration pilot. Remaining screens migrate per-ticket later.

## Definition of done

- [x] `apps/mobile` typecheck, lint, and tests pass; reusables `doctor` is green.
- [x] Web bundle builds through metro (`expo export --platform web`).
- [x] Review screen renders identically (light theme) with className-based styling.

## Comments

- Stack: nativewind 4.2.6 + tailwindcss 3.4.17 (v5/tailwind 4 is not SDK 54
  compatible), reanimated ~4.1.7 + worklets 0.5.1 via `expo install`, reusables
  manual setup (`components.json`, `lib/utils.ts`, `lib/theme.ts`,
  `PortalHost` in root layout). First components: `components/ui/button.tsx`
  and `text.tsx` via `pnpm dlx @react-native-reusables/cli add button`.
- The existing palette was mapped onto shadcn-style CSS variables in
  `global.css` (light + dark): background #fffaf3, foreground/primary #25352d,
  secondary #fdf6e9 (warm "original recipe" panel), muted #eef1ed,
  destructive #a43b32, border/input #d9ded8, ring #28734a. Two custom token
  families were added: `brand` (#28734a green accent) and `panel.border/
  label/hint` (#e6d5a8/#6b5a2e/#8a7a4d) for the warm panel. `lib/theme.ts`
  mirrors the same values for react-navigation (NAV_THEME).
- `react-native-css-interop@0.2.6` must stay a **direct** dependency: the
  nativewind babel preset rewrites JSX imports to
  `react-native-css-interop/jsx-runtime`, which pnpm cannot resolve from app
  source when the package is only transitive.
- `@rn-primitives/*` ship **untranspiled JSX** in both dist builds (Metro-only
  packaging). The app runtime is unaffected (Metro transpiles node_modules),
  but vitest cannot parse the imports; `test/mocks/rn-primitives-slot.js` is a
  thin stub aliased in `vitest.config.ts`. Any future primitive that enters
  the test graph (e.g. portal via overlay components) needs the same alias.
- The reusables template imports ThemeProvider from
  `expo-router/react-navigation`, which does not exist in expo-router v6;
  `@react-navigation/native@7.3.18` (the version expo-router resolves) was
  added as a direct dependency instead.
- Pilot conversion of `app/create-recipe/review.tsx`: StyleSheet removed,
  tokens + utility classes, saved-state button is now the reusables `Button`.
  Two normalizations: the saved-state title no longer double-pads horizontally
  (was 24+24px), and the button uses the default Button size instead of the
  old bespoke 14px vertical padding.
- Dark-theme tokens are defined but the app stays light (default
  `userInterfaceStyle`); switching to `automatic` is a design decision for a
  future ticket. Remaining screens still use StyleSheet and migrate
  per-ticket; prettier now sorts tailwind classes via
  `prettier-plugin-tailwindcss` (root `.prettierrc.json`).
