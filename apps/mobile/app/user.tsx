import { Link, Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getAuthenticatedState } from '../src/auth/session';

export default function User() {
  const state = getAuthenticatedState();

  if (!state) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zalogowano</Text>
      <Text style={styles.email}>{state.user.email}</Text>
      <Text style={styles.message}>
        Jesteś zalogowany i możesz zarządzać swoimi przepisami.
      </Text>
      <Link href="/" style={styles.button}>
        <Text style={styles.buttonText}>Wróć do ekranu głównego</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffaf3',
  },
  title: { color: '#25352d', fontSize: 28, fontWeight: '700' },
  email: { color: '#68736d', fontSize: 16, marginTop: 8 },
  message: {
    color: '#68736d',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 24,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 32,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
