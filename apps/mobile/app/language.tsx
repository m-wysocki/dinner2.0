import type { InterfaceLanguage } from '@dinner/shared';
import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('language.title')}</Text>
      <Text style={styles.message}>{t('language.message')}</Text>

      {OPTIONS.map((option) => {
        const selected = option.value === language;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => void select(option.value)}
            disabled={saving}
          >
            <Text style={styles.optionText}>{t(option.labelKey)}</Text>
            {selected && (
              <Text style={styles.optionCurrent}>{t('language.current')}</Text>
            )}
          </Pressable>
        );
      })}

      {error && <Text style={styles.error}>{error}</Text>}
      {saving && (
        <View style={styles.saving}>
          <ActivityIndicator color="#28734a" />
        </View>
      )}

      <Link href="/user" style={styles.button}>
        <Text style={styles.buttonText}>{t('app.back')}</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fffaf3',
  },
  title: { color: '#25352d', fontSize: 30, fontWeight: '700' },
  message: {
    color: '#68736d',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#d9ded8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 16,
  },
  optionSelected: {
    backgroundColor: '#eef6f0',
    borderColor: '#28734a',
  },
  optionText: { color: '#25352d', fontSize: 17, fontWeight: '600' },
  optionCurrent: { color: '#28734a', fontSize: 14, fontWeight: '600' },
  saving: { alignItems: 'center', marginTop: 16 },
  error: {
    color: '#a43b32',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
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
