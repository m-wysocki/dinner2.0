# 28: Auth screens migration (login, register, confirm)

**What to build:** The three authentication screens (login, registration, email confirmation) are rebuilt on the reusables primitives with token-based className styling; their behavior, validation flow, and error states are unchanged.

**Blocked by:** 27: UI primitives and root layout migration

**Status:** resolved

## Definition of done

- [x] Login, register, and confirm screens use reusables Button, Text, Input (and other primitives where they fit); StyleSheet styling removed.
- [x] Submitting, disabled, and failure states render through the new components with the existing translations.
- [x] Existing auth screen tests pass (updated to the new markup where needed).
- [x] `apps/mobile` typecheck, lint, and tests pass.

## Comments

- Merged into one ticket per user decision: the screens are small and structurally identical.
- All three screens now use `Button`, `Input`, and `Text` from `components/ui`
  with className token styling (`bg-background`, `text-foreground`,
  `text-muted-foreground`, `text-destructive`, `text-brand`); every
  `StyleSheet` and hex literal is gone. `#28734a` maps exactly to the existing
  `--brand` token, so no new CSS variable was needed.
- Submitting/disabled/failure states are unchanged: disabled `Input`s +
  `Button` during submit, spinner inside the button, localized error text.
  Deep-link handling in `confirm.tsx` is untouched.
- Links render as `<Link asChild>` wrapping a `Button` (success/failure
  back-home actions) or a styled `Text` (login.noAccount / app.back), which
  replaces the hand-styled link markup.
- Spinner colors come from `THEME[colorScheme].brand` /
  `THEME[colorScheme].primaryForeground` via `useColorScheme` from
  `react-native` (not `nativewind` — its dist is untranspiled and Node/vitest
  cannot parse it; react-native-web's hook works in the same renderer the
  tests exercise).
- Test-graph note: `@/lib/theme` imports `@react-navigation/native`, whose
  `lib/module` build is extensionless ESM that Node's loader rejects when
  Vitest externalizes it. Fixed by inlining the package in `vitest.config.ts`
  (`test.server.deps.inline`) rather than stubbing it, so the real theme
  objects stay in the graph. Existing auth tests needed no behavioral edits.
