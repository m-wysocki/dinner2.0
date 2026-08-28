import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
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
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.health(),
  });

  return (
    <View style={styles.container}>
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

      {authenticatedState?.user.accessStatus === 'ACTIVE' &&
      authenticatedState.user.emailConfirmedAt ? (
        <View style={styles.authenticatedPanel}>
          <Text style={styles.menuTitle}>Menu</Text>
          <View style={styles.menu}>
            <Link href="/" style={styles.menuItem}>
              <Text>Przepisy</Text>
            </Link>
            <Link href="/create-recipe" style={styles.menuItem}>
              <Text>Dodaj przepis</Text>
            </Link>
            <Link href="/ingredient-catalog" style={styles.menuItem}>
              <Text>Katalog składników</Text>
            </Link>
            <Link href="/user" style={styles.menuItem}>
              <Text>Konto</Text>
            </Link>
          </View>
          <Text style={styles.authenticatedTitle}>Jesteś zalogowany</Text>
          <Text style={styles.details}>{authenticatedState.user.email}</Text>
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
          <Text style={styles.authenticatedTitle}>
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
    </View>
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
  menuTitle: {
    color: '#25352d',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  menuItem: {
    backgroundColor: '#dfe9df',
    borderRadius: 8,
    color: '#25352d',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authenticatedTitle: { color: '#28734a', fontSize: 17, fontWeight: '600' },
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
