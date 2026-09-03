import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageToggle } from '@/components/language-toggle';

export function AuthScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-row justify-end px-4 pt-3">
        <LanguageToggle />
      </View>
      <View className="flex-1 md:mx-auto md:w-full md:max-w-md">
        {children}
      </View>
    </View>
  );
}
