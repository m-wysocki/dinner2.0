import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    // Expo's tsconfig.base uses `jsx: 'react-native'` (classic runtime); the
    // tests are transformed by esbuild, so use the automatic runtime instead.
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      // The app imports real react-native (Flow, native modules) which cannot be
      // loaded in the Node test environment. Provide a thin host-component mock
      // so screen-level tests render through the RNTL test renderer.
      'react-native': new URL('./test/mocks/react-native.js', import.meta.url)
        .pathname,
      'expo-secure-store': new URL(
        './test/mocks/expo-secure-store.js',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
