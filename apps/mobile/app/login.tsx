import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { submitLogin } from '../src/auth/login';
import { useI18n } from '../src/i18n/i18n';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'failure'; message: string };

export default function Login() {
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  async function handleSubmit() {
    if (submit.kind === 'submitting') {
      return;
    }

    setSubmit({ kind: 'submitting' });

    const result = await submitLogin({ email, password });

    if (result.kind === 'success') {
      router.replace('/user');
      return;
    }

    setSubmit({ kind: 'failure', message: result.message });
  }

  return (
    <AppShell>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow p-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-[28px] font-bold text-foreground">
            {t('login.title')}
          </Text>
          <Text className="mb-6 mt-2 text-base text-muted-foreground">
            {t('login.subtitle')}
          </Text>

          <Input
            className="mb-3"
            value={email}
            onChangeText={setEmail}
            placeholder={t('login.emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={submit.kind !== 'submitting'}
          />

          <Input
            className="mb-3"
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            editable={submit.kind !== 'submitting'}
          />

          {submit.kind === 'failure' && (
            <Text className="mb-3 text-center text-[15px] font-semibold text-destructive">
              {submit.message}
            </Text>
          )}

          <Button
            className="mt-1 w-full"
            onPress={() => void handleSubmit()}
            disabled={submit.kind === 'submitting'}
          >
            {submit.kind === 'submitting' ? (
              <ActivityIndicator
                color={THEME[colorScheme ?? 'light'].primaryForeground}
              />
            ) : (
              <Text className="text-base font-semibold">
                {t('login.submit')}
              </Text>
            )}
          </Button>

          <Link href="/register" asChild>
            <Text className="mt-5 text-center text-[15px] text-muted-foreground">
              {t('login.noAccount')}
            </Text>
          </Link>
          <Link href="/" asChild>
            <Text className="mt-5 text-center text-[15px] text-muted-foreground">
              {t('app.back')}
            </Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
