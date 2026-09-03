import type { InterfaceLanguage } from '@dinner/shared';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { apiClient } from '@/src/api/client';
import {
  getAuthenticatedState,
  setAuthenticatedState,
} from '@/src/auth/session';
import { useI18n } from '@/src/i18n/i18n';

const OPTIONS = [
  { value: 'pl', label: 'PL', labelKey: 'language.polish' },
  { value: 'en', label: 'EN', labelKey: 'language.english' },
] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const { t, language, setLanguage } = useI18n();
  const [saving, setSaving] = useState(false);

  async function select(next: InterfaceLanguage) {
    if (saving || next === language) {
      return;
    }

    const previous = language;
    setSaving(true);
    setLanguage(next);

    const authState = getAuthenticatedState();

    if (!authState) {
      // Logged out: the choice lives on the device only (persisted by the
      // I18nProvider), there is no account to save it to.
      setSaving(false);
      return;
    }

    try {
      const updated = await apiClient.updateUser({ interfaceLanguage: next });
      await setAuthenticatedState({ ...authState, user: updated });
    } catch {
      setLanguage(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      className={cn(
        'flex-row overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = option.value === language;
        return (
          <Pressable
            key={option.value}
            accessibilityLabel={t(option.labelKey)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn('px-3 py-1.5', active && 'bg-accent')}
            disabled={saving}
            onPress={() => void select(option.value)}
          >
            <Text
              className={cn(
                'text-[13px] font-semibold',
                active ? 'text-brand' : 'text-muted-foreground',
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
