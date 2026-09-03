// nativewind's runtime pulls react-native-css-interop, which requires React
// Native's Flow source outside Metro; tests only need the CSS-interop
// registration to be a no-op and the hook to return a light scheme.
export function cssInterop() {}

export function remapProps() {}

export function useColorScheme() {
  return { colorScheme: 'light', setColorScheme: () => {} };
}
