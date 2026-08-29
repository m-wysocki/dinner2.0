import '@testing-library/jest-dom/vitest';

(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
