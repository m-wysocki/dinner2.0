import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { confirmEmailViaLink } from '../src/auth/confirm';
import { useI18n } from '../src/i18n/i18n';

type ConfirmState =
  | { kind: 'pending' }
  | { kind: 'success' }
  | { kind: 'failure'; message: string };

export default function Confirm() {
  const { t } = useI18n();
  const colorScheme = useColorScheme();
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
    <AppShell>
      <ScrollView contentContainerClassName="grow bg-background p-6">
        <Text className="text-[28px] font-bold text-foreground">
          {t('confirm.title')}
        </Text>

        {state.kind === 'pending' && (
          <View className="mt-8 items-center">
            <ActivityIndicator color={THEME[colorScheme ?? 'light'].brand} />
            <Text className="mt-3 text-base text-muted-foreground">
              {t('confirm.checking')}
            </Text>
          </View>
        )}

        {state.kind === 'success' && (
          <>
            <Text className="mt-6 text-lg font-bold text-brand">
              {t('confirm.success')}
            </Text>
            <Text className="mt-3 text-base leading-6 text-muted-foreground">
              {t('confirm.successMessage')}
            </Text>
            <Link href="/" asChild>
              <Button className="mt-6">
                <Text className="text-base font-semibold">
                  {t('app.backToHome')}
                </Text>
              </Button>
            </Link>
          </>
        )}

        {state.kind === 'failure' && (
          <>
            <Text className="mt-6 text-base font-semibold leading-6 text-destructive">
              {state.message}
            </Text>
            <Link href="/" asChild>
              <Button className="mt-6">
                <Text className="text-base font-semibold">
                  {t('app.backToHome')}
                </Text>
              </Button>
            </Link>
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}
