import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { apiClient } from '../src/api/client';
import {
  restoreAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
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

  if (!sessionRestored) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#28734a" />
        <Text style={styles.loadingText}>Ładowanie dinner2...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#fffaf3',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: { color: '#68736d', marginTop: 12 },
});
