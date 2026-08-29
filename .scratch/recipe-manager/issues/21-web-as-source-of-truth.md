# 21: Web as the source of truth for platform verification

**What to build:** Screen tests render against the real web renderer (react-native-web) and CI verifies a web export, so the surface the user actually tests is the surface that is verified.

**Blocked by:** none

**Status:** ready-for-agent

## Background

The user tests only the web build, yet the mobile screen tests run against a hand-rolled mock of `react-native` with `Platform.OS` hardcoded to `'ios'` (`apps/mobile/test/mocks/react-native.js:35-40`). This produced repeated "mobile works, web doesn't" surprises: agents claimed success from a native-style mock that never exercises the web path. CI runs no web build at all. The repository states web is a required product surface (`CONTEXT.md`, `README.md:21`).

Decision (grill-with-docs): web is the source of truth. Tests must verify the web renderer, CI must build the web bundle, and no platform claim may be made without web verification.

## What to do

- Switch the screen/component test suite from the hand-rolled `react-native` mock to the real web renderer: render through **react-native-web** (via the existing `@testing-library/react-native` if it supports the web render target, otherwise `@testing-library/react` + jsdom/happy-dom). The tests must exercise the same code path a web user runs, including `Platform.OS === 'web'`.
- Replace the vitest aliases (`apps/mobile/vitest.config.ts:14-15`), the `Module._resolveFilename` redirect (`test/setup.ts:26-42`), and the mocks under `apps/mobile/test/mocks/` so they no longer substitute a fake `react-native`.
- Cover the previously untested web branch of the session storage (`apps/mobile/src/auth/session.ts:33-35,41-43,50-52` — the `localStorage` path) with tests under a DOM environment.
- Add a web export/build verification step to CI (`.github/workflows/ci.yml`): `expo export --platform web` must succeed and be part of the required checks. Ensure the export output stays ignored by git and prettier.
- Keep native untested and unclaimed: the iOS `KeyboardAvoidingView` branches and `expo-secure-store` path may remain in code, but nothing may assert they work.

## Definition of done

- [ ] Mobile screen/component tests run against react-native-web in a DOM environment, not the custom `react-native` mock.
- [ ] The `session.ts` web (`localStorage`) path is covered by passing tests.
- [ ] The hand-rolled `react-native` mock and its resolution redirect are removed.
- [ ] CI includes a passing `expo export --platform web` step.
- [ ] Workspace typecheck, lint, format, and full test suite pass; all existing mobile tests still pass on the new renderer.