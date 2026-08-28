import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../src/api/client';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
} from '../src/auth/session';

export default function Index() {
  const authenticatedState = getAuthenticatedState();
  const isActiveUser =
    authenticatedState?.user.accessStatus === 'ACTIVE' &&
    Boolean(authenticatedState.user.emailConfirmedAt);
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.health(),
  });
  const recipesQuery = useQuery({
    queryKey: ['recipes', authenticatedState?.user.id],
    queryFn: () => apiClient.listRecipes(),
    enabled: isActiveUser,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>dinner2</Text>
      <Text style={styles.subtitle}>Menedżer przepisów</Text>

      {healthQuery.isPending && (
        <View style={styles.status}>
          <ActivityIndicator />
          <Text style={styles.message}>Łączenie z API...</Text>
        </View>
      )}

      {healthQuery.isError && (
        <View style={styles.status}>
          <Text style={styles.error}>Nie udało się połączyć z API.</Text>
          <Text style={styles.details}>{healthQuery.error.message}</Text>
          <Pressable
            style={styles.button}
            onPress={() => void healthQuery.refetch()}
          >
            <Text style={styles.buttonText}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      )}

      {healthQuery.isSuccess && (
        <View style={styles.status}>
          <Text style={styles.success}>API działa prawidłowo</Text>
          <Text style={styles.details}>Połączenie zostało ustanowione.</Text>
        </View>
      )}

      {isActiveUser ? (
        <View style={styles.authenticatedPanel}>
          <Text style={styles.collectionTitle}>Twoja kolekcja</Text>
          <Text style={styles.details}>{authenticatedState.user.email}</Text>
          {recipesQuery.isPending && (
            <View style={styles.collectionStatus}>
              <ActivityIndicator />
              <Text style={styles.message}>Ładowanie przepisów...</Text>
            </View>
          )}
          {recipesQuery.isError && (
            <View style={styles.collectionStatus}>
              <Text style={styles.error}>Nie udało się pobrać przepisów.</Text>
              <Text style={styles.details}>{recipesQuery.error.message}</Text>
              <Pressable
                style={styles.button}
                onPress={() => void recipesQuery.refetch()}
              >
                <Text style={styles.buttonText}>Spróbuj ponownie</Text>
              </Pressable>
            </View>
          )}
          {recipesQuery.isSuccess && recipesQuery.data.length === 0 && (
            <View style={styles.collectionStatus}>
              <Text style={styles.emptyTitle}>Nie masz jeszcze przepisów</Text>
              <Text style={styles.details}>
                Dodaj pierwszy przepis do swojej kolekcji.
              </Text>
              <Link href="/create-recipe" style={styles.button}>
                <Text style={styles.buttonText}>Dodaj przepis</Text>
              </Link>
            </View>
          )}
          {recipesQuery.isSuccess && recipesQuery.data.length > 0 && (
            <View style={styles.recipeList}>
              {recipesQuery.data.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => router.push(`/recipes/${recipe.id}`)}
                >
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.details}>
                    {recipe.servingCount} porcji
                  </Text>
                </Pressable>
              ))}
              <Link href="/create-recipe" style={styles.button}>
                <Text style={styles.buttonText}>Dodaj przepis</Text>
              </Link>
            </View>
          )}
          <Pressable
            style={styles.logoutButton}
            onPress={() => {
              clearAuthenticatedState();
              router.replace('/');
            }}
          >
            <Text style={styles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      ) : authenticatedState ? (
        <View style={styles.authenticatedPanel}>
          <Text style={styles.collectionTitle}>
            Dostęp oczekuje na aktywację
          </Text>
          <Text style={styles.details}>{authenticatedState.user.email}</Text>
          <Link href="/user" style={styles.button}>
            <Text style={styles.buttonText}>Sprawdź status konta</Text>
          </Link>
          <Pressable
            style={styles.logoutButton}
            onPress={() => {
              clearAuthenticatedState();
              router.replace('/');
            }}
          >
            <Text style={styles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Link href="/login" style={styles.button}>
            <Text style={styles.buttonText}>Zaloguj się</Text>
          </Link>
          <Link href="/register" style={styles.link}>
            <Text style={styles.linkText}>
              Nie masz konta? Zarejestruj się.
            </Text>
          </Link>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffaf3',
  },
  title: { color: '#25352d', fontSize: 36, fontWeight: '700' },
  subtitle: { color: '#68736d', fontSize: 16, marginTop: 8 },
  status: { alignItems: 'center', marginTop: 48 },
  authenticatedPanel: { alignItems: 'center', marginTop: 32, width: '100%' },
  collectionTitle: { color: '#25352d', fontSize: 24, fontWeight: '700' },
  emptyTitle: { color: '#25352d', fontSize: 18, fontWeight: '600' },
  recipeList: { width: '100%' },
  recipeCard: {
    backgroundColor: '#fff',
    borderColor: '#d9ded8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  recipeTitle: { color: '#25352d', fontSize: 18, fontWeight: '600' },
  collectionStatus: { alignItems: 'center', marginTop: 24 },
  message: { color: '#68736d', marginTop: 12 },
  success: { color: '#28734a', fontSize: 17, fontWeight: '600' },
  error: {
    color: '#a43b32',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  details: { color: '#68736d', marginTop: 8, textAlign: 'center' },
  button: {
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  logoutButton: { marginTop: 16, padding: 8 },
  logoutText: { color: '#a43b32', fontSize: 15, fontWeight: '600' },
  link: { marginTop: 12 },
  linkText: { color: '#68736d', fontSize: 15 },
});
