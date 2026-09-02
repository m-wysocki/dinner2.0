import type { InterfaceLanguage } from '@dinner/shared';
import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { apiClient } from '../src/api/client';
import {
  getAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';
import { useI18n, type TranslationKey } from '../src/i18n/i18n';

const OPTIONS: Array<{
  value: InterfaceLanguage;
  labelKey: TranslationKey;
}> = [
  { value: 'pl', labelKey: 'language.polish' },
  { value: 'en', labelKey: 'language.english' },
];

export default function Language() {
  const { t, language, setLanguage } = useI18n();
  const colorScheme = useColorScheme();
  const state = getAuthenticatedState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) {
    return <Redirect href="/login" />;
  }

  const authState = state;

  async function select(next: InterfaceLanguage) {
    if (saving || next === language) {
      return;
    }

    setSaving(true);
    setError(null);
    setLanguage(next);

    try {
      const updated = await apiClient.updateUser({ interfaceLanguage: next });
      await setAuthenticatedState({ ...authState, user: updated });
    } catch (caught) {
      setLanguage(authState.user.interfaceLanguage);
      setError(
        caught instanceof Error ? caught.message : t('language.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow p-6"
    >
      <Text className="text-[30px] font-bold text-foreground">
        {t('language.title')}
      </Text>
      <Text className="mt-3 text-base leading-6 text-muted-foreground">
        {t('language.message')}
      </Text>

      {OPTIONS.map((option) => {
        const selected = option.value === language;
        return (
          <Button
            key={option.value}
            variant="outline"
            className={cn(
              'mt-3 w-full justify-between border-border bg-card px-4 py-4',
              selected && 'border-brand bg-accent',
            )}
            onPress={() => void select(option.value)}
            disabled={saving}
          >
            <Text className="text-[17px] font-semibold text-foreground">
              {t(option.labelKey)}
            </Text>
            {selected && (
              <Text className="text-sm font-semibold text-brand">
                {t('language.current')}
              </Text>
            )}
          </Button>
        );
      })}

      {error && (
        <Text className="mt-4 text-center text-[15px] font-semibold text-destructive">
          {error}
        </Text>
      )}
      {saving && (
        <View className="mt-4 items-center">
          <ActivityIndicator color={THEME[colorScheme ?? 'light'].brand} />
        </View>
      )}

      <Link href="/user" asChild>
        <Button className="mt-8 w-full">
          <Text className="text-base font-semibold">{t('app.back')}</Text>
        </Button>
      </Link>
    </ScrollView>
  );
}
