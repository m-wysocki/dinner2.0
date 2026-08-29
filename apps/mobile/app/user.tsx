import { Link, Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../src/i18n/i18n';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
} from '../src/auth/session';

export default function User() {
  const { t } = useI18n();
  const state = getAuthenticatedState();

  if (!state) {
    return <Redirect href="/login" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.email}>{state.user.email}</Text>
      {state.user.accessStatus === 'PENDING' ? (
        <>
          <Text style={styles.title}>{t('user.titlePending')}</Text>
          <Text style={styles.message}>{t('user.messagePending')}</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>{t('user.titleActive')}</Text>
          <Text style={styles.message}>{t('user.messageActive')}</Text>
        </>
      )}
      <Link href="/" style={styles.button}>
        <Text style={styles.buttonText}>{t('app.backToHome')}</Text>
      </Link>
      <Link href="/language" style={styles.button}>
        <Text style={styles.buttonText}>{t('user.language')}</Text>
      </Link>
      <Pressable
        style={styles.logoutButton}
        onPress={() => {
          clearAuthenticatedState();
          router.replace('/login');
        }}
      >
        <Text style={styles.logoutText}>{t('app.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  logoutButton: { alignItems: 'center', marginTop: 20, paddingVertical: 14 },
  logoutText: { color: '#a43b32', fontSize: 16, fontWeight: '600' },
});
