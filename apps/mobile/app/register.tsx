import { useState } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { submitRegistration } from '../src/auth/register';
import { useI18n } from '../src/i18n/i18n';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'failure'; message: string };

export default function Register() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  async function handleSubmit() {
    if (submit.kind === 'submitting') {
      return;
    }

    setSubmit({ kind: 'submitting' });

    const result = await submitRegistration({ email, password });

    if (result.kind === 'success') {
      setSubmit({ kind: 'success' });
      return;
    }

    setSubmit({ kind: 'failure', message: result.message });
  }

  if (submit.kind === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('register.successTitle')}</Text>
        <Text style={styles.message}>{t('register.successMessage')}</Text>
        <Link href="/" style={styles.button}>
          <Text style={styles.buttonText}>{t('app.backToHome')}</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('register.title')}</Text>
        <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('register.emailPlaceholder')}
          placeholderTextColor="#9aa39e"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={submit.kind !== 'submitting'}
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t('register.passwordPlaceholder')}
          placeholderTextColor="#9aa39e"
          secureTextEntry
          autoCapitalize="none"
          editable={submit.kind !== 'submitting'}
        />

        {submit.kind === 'failure' && (
          <Text style={styles.error}>{submit.message}</Text>
        )}

        <Pressable
          style={[
            styles.button,
            submit.kind === 'submitting' && styles.buttonDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={submit.kind === 'submitting'}
        >
          {submit.kind === 'submitting' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('register.submit')}</Text>
          )}
        </Pressable>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('app.back')}</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf3',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#25352d', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#68736d', fontSize: 16, marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#d8ddd9',
    borderRadius: 8,
    borderWidth: 1,
    color: '#25352d',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: '#a43b32',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center', marginTop: 20 },
  linkText: { color: '#68736d', fontSize: 15 },
  message: {
    color: '#68736d',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    marginTop: 12,
  },
});
