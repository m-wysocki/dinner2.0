import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../src/api/client';

export default function Index() {
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

      <Link href="/login" style={styles.button}>
        <Text style={styles.buttonText}>Zaloguj się</Text>
      </Link>
      <Link href="/register" style={styles.link}>
        <Text style={styles.linkText}>Nie masz konta? Zarejestruj się.</Text>
      </Link>
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
  link: { marginTop: 12 },
  linkText: { color: '#68736d', fontSize: 15 },
});
