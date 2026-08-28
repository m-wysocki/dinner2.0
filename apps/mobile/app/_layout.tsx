import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
