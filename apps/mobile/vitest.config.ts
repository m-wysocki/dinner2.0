import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    // Expo's tsconfig.base uses `jsx: 'react-native'` (classic runtime); the
    // tests are transformed by esbuild, so use the automatic runtime instead.
    jsx: 'automatic',
  },
  resolve: {
    alias: [
      // The web build runs through react-native-web (see expo/webpack-config),
      // so tests must exercise that same renderer instead of a react-native mock.
      // The bare 'react-native' specifier is remapped; subpath imports are untouched.
      { find: /^react-native$/, replacement: 'react-native-web' },
      // expo-secure-store is a native module with no DOM/web entry usable in jsdom;
      // keep a thin in-memory substitute so the web session path can import it.
      {
        find: 'expo-secure-store',
        replacement: new URL(
          './test/mocks/expo-secure-store.js',
          import.meta.url,
        ).pathname,
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
