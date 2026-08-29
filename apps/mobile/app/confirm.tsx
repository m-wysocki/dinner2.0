import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { confirmEmailViaLink } from '../src/auth/confirm';
import { useI18n } from '../src/i18n/i18n';

type ConfirmState =
  | { kind: 'pending' }
  | { kind: 'success' }
  | { kind: 'failure'; message: string };

export default function Confirm() {
  const { t } = useI18n();
  const [state, setState] = useState<ConfirmState>({ kind: 'pending' });

  useEffect(() => {
    let cancelled = false;

    async function process(url: string) {
      const result = await confirmEmailViaLink(url);

      if (cancelled) {
        return;
      }

      if (result.kind === 'success') {
        setState({ kind: 'success' });
      } else {
        setState({ kind: 'failure', message: result.message });
      }
    }

    async function run() {
      const url = await Linking.getInitialURL();

      if (cancelled) {
        return;
      }

      if (url != null) {
        await process(url);
      } else {
        setState({
          kind: 'failure',
          message: t('confirm.noLink'),
        });
      }
    }

    void run();

    const subscription = Linking.addEventListener('url', (event) => {
      void process(event.url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [t]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('confirm.title')}</Text>

      {state.kind === 'pending' && (
        <View style={styles.status}>
          <ActivityIndicator />
          <Text style={styles.message}>{t('confirm.checking')}</Text>
        </View>
      )}

      {state.kind === 'success' && (
        <>
          <Text style={styles.success}>{t('confirm.success')}</Text>
          <Text style={styles.message}>{t('confirm.successMessage')}</Text>
          <Link href="/" style={styles.button}>
            <Text style={styles.buttonText}>{t('app.backToHome')}</Text>
          </Link>
        </>
      )}

      {state.kind === 'failure' && (
        <>
          <Text style={styles.error}>{state.message}</Text>
          <Link href="/" style={styles.button}>
            <Text style={styles.buttonText}>{t('app.backToHome')}</Text>
          </Link>
        </>
      )}
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
  status: { alignItems: 'center', marginTop: 32 },
  success: {
    color: '#28734a',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
  },
  error: {
    color: '#a43b32',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 24,
  },
  message: {
    color: '#68736d',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
