# 03: Mobile bootstrap and API client

**What to build:** An Expo mobile application with basic routing and a typed client capable of calling the API.

**Blocked by:** 01: Workspace foundation

**Status:** resolved

- [x] Mobile app starts through the workspace tooling.
- [x] Base navigation and loading/error states exist.
- [x] Mobile configuration can target the local API without hard-coded secrets.
- [x] TanStack Query is configured for API requests.

## Resolution

Added the Expo Router shell with a TanStack Query provider, a configurable API URL, a typed and schema-validated API client, and a health screen covering loading, success, error, and retry states. Mobile type checking, tests, linting, formatting, and the workspace test suite pass. Expo iOS export remains blocked by a `react-native-screens` dependency/toolchain compatibility error.
