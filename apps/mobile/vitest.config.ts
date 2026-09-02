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
      // @rn-primitives/* ship untranspiled JSX in their dists (Metro-only);
      // remap to the thin stub so Node can parse the import graph.
      {
        find: /^@rn-primitives\/slot$/,
        replacement: new URL(
          './test/mocks/rn-primitives-slot.js',
          import.meta.url,
        ).pathname,
      },
      // Design-system imports (reusables components) resolve the same `@/*`
      // alias that tsconfig defines for the app root.
      {
        find: /^@\/(.*)$/,
        replacement: `${new URL('.', import.meta.url).pathname}$1`,
      },
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
    server: {
      deps: {
        // @react-navigation/native ships extensionless ESM in lib/module that
        // Node's loader rejects when externalized; lib/theme.ts (pulled in by
        // className-migrated screens for spinner colors) imports its themes,
        // so let Vite transform the package instead.
        inline: ['@react-navigation/native'],
      },
    },
  },
});
