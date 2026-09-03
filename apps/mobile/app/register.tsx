import { Link } from 'expo-router';
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
import { AuthScreen } from '@/components/auth-screen';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { submitRegistration } from '../src/auth/register';
import { useI18n } from '../src/i18n/i18n';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'failure'; message: string };

export default function Register() {
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

    const result = await submitRegistration({ email, password });

    if (result.kind === 'success') {
      setSubmit({ kind: 'success' });
      return;
    }

    setSubmit({ kind: 'failure', message: result.message });
  }

  if (submit.kind === 'success') {
    return (
      <AuthScreen>
        <View className="flex-1 bg-background p-6">
          <Text className="text-[28px] font-bold text-foreground">
            {t('register.successTitle')}
          </Text>
          <Text className="mb-8 mt-3 text-base leading-6 text-muted-foreground">
            {t('register.successMessage')}
          </Text>
          <Link href="/login" asChild>
            <Button>
              <Text className="text-base font-semibold">
                {t('auth.goToLogin')}
              </Text>
            </Button>
          </Link>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow p-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-[28px] font-bold text-foreground">
            {t('register.title')}
          </Text>
          <Text className="mb-6 mt-2 text-base text-muted-foreground">
            {t('register.subtitle')}
          </Text>

          <Input
            className="mb-3"
            value={email}
            onChangeText={setEmail}
            placeholder={t('register.emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={submit.kind !== 'submitting'}
          />

          <Input
            className="mb-3"
            value={password}
            onChangeText={setPassword}
            placeholder={t('register.passwordPlaceholder')}
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
                {t('register.submit')}
              </Text>
            )}
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </AuthScreen>
  );
}
