import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { apiClient } from '../src/api/client';
import { I18nProvider, useI18n } from '../src/i18n/i18n';
import {
  restoreAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';
import { NAV_THEME } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function LoadingScreen() {
  const { t } = useI18n();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <ActivityIndicator color="hsl(147, 48%, 30%)" />
      <Text className="mt-3 text-muted-foreground">{t('app.loading')}</Text>
    </View>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    void (async () => {
      const state = await restoreAuthenticatedState();

      if (state) {
        try {
          const user = await apiClient.currentUser();
          await setAuthenticatedState({ ...state, user });
        } catch {
          // Keep the cached session when refreshing the user is unavailable.
        }
      }

      setSessionRestored(true);
    })();
  }, []);

  return (
    <I18nProvider>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {!sessionRestored ? (
          <LoadingScreen />
        ) : (
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        )}
        <PortalHost />
      </ThemeProvider>
    </I18nProvider>
  );
}
