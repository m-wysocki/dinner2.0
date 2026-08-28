import type { IngredientCatalogEntry } from '@dinner/shared';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';

export default function IngredientCatalog() {
  const state = getAuthenticatedState();
  const [entries, setEntries] = useState<IngredientCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !state ||
      state.user.accessStatus !== 'ACTIVE' ||
      !state.user.emailConfirmedAt
    )
      return;
    void apiClient
      .ingredientCatalog()
      .then(setEntries)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : 'Nie udało się pobrać katalogu.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [state?.user.id, state?.user.accessStatus, state?.user.emailConfirmedAt]);

  if (!state) return <Redirect href="/login" />;
  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt)
    return <Redirect href="/user" />;

  return (
    <View style={styles.container}>
      <Link href="/" style={styles.back}>
        Powrót do menu
      </Link>
      <Text style={styles.title}>Katalog składników</Text>
      {isLoading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.name}>
              {state.user.interfaceLanguage === 'en'
                ? item.nameEn
                : item.namePl}
            </Text>
            <Text style={styles.type}>
              {item.isSystem ? 'Systemowy' : 'Własny'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf3', padding: 24 },
  back: { color: '#28734a', fontWeight: '600', marginBottom: 24 },
  title: {
    color: '#25352d',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
  },
  entry: {
    borderBottomColor: '#d9ded8',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  name: { color: '#25352d', fontSize: 17, fontWeight: '600' },
  type: { color: '#68736d', marginTop: 4 },
  error: { color: '#a43b32', marginBottom: 12 },
});
