// Native module with no DOM/web entry usable in jsdom; the app shell only
// reads the insets, which are zero in tests.
export function useSafeAreaInsets() {
  return { top: 0, bottom: 0, left: 0, right: 0 };
}

export const SafeAreaView = 'View';
