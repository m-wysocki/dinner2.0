import { extractRecipeRequestSchema } from '@dinner/shared';
import { router, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError, apiClient } from '../../src/api/client';
import { getAuthenticatedState } from '../../src/auth/session';
import { useI18n } from '../../src/i18n/i18n';
import { setCreateDraft } from '../../src/recipe/create-draft';

export default function CreateRecipe() {
  const { t } = useI18n();
  const state = getAuthenticatedState();
  const [title, setTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [servingCount, setServingCount] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) {
    return <Redirect href="/login" />;
  }

  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt) {
    return <Redirect href="/user" />;
  }

  async function extract() {
    const parsed = extractRecipeRequestSchema.safeParse({
      title: title.trim(),
      sourceText: sourceText.trim(),
      servingCount: Number(servingCount),
    });

    if (!parsed.success) {
      setError(t('create.inputRequired'));
      return;
    }

    setError(null);
    setIsExtracting(true);
    try {
      const draft = await apiClient.extractRecipe(parsed.data);
      setCreateDraft({ draft, sourceText: parsed.data.sourceText });
      router.push('/create-recipe/review');
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'EXTRACTION_FAILED') {
        setError(t('create.extractFailed'));
      } else {
        setError(
          caught instanceof Error ? caught.message : t('create.extractFailed'),
        );
      }
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('create.title')}</Text>
      <Text style={styles.label}>{t('form.title')}</Text>
      <TextInput
        accessibilityLabel={t('form.title')}
        autoCapitalize="sentences"
        onChangeText={setTitle}
        placeholder={t('form.titlePlaceholder')}
        style={styles.input}
        value={title}
      />
      <Text style={styles.label}>{t('create.sourceTextLabel')}</Text>
      <TextInput
        accessibilityLabel={t('create.sourceTextLabel')}
        autoCapitalize="sentences"
        maxLength={20000}
        multiline
        onChangeText={setSourceText}
        placeholder={t('create.sourceTextPlaceholder')}
        style={[styles.input, styles.sourceText]}
        value={sourceText}
      />
      <Text style={styles.label}>{t('create.servingCount')}</Text>
      <TextInput
        accessibilityLabel={t('create.servingCount')}
        keyboardType="number-pad"
        onChangeText={setServingCount}
        placeholder={t('create.servingCountPlaceholder')}
        style={styles.input}
        value={servingCount}
      />
      {error && (
        <View style={styles.errorPanel}>
          <Text style={styles.error}>{error}</Text>
          <Pressable disabled={isExtracting} onPress={() => void extract()}>
            <Text style={styles.retry}>{t('app.retry')}</Text>
          </Pressable>
        </View>
      )}
      <Pressable
        disabled={isExtracting}
        onPress={() => void extract()}
        style={styles.button}
      >
        {isExtracting ? (
          <View style={styles.extracting}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>{t('create.extracting')}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{t('create.extract')}</Text>
        )}
      </Pressable>
      <Pressable
        disabled={isExtracting}
        onPress={() => router.back()}
        style={styles.cancel}
      >
        <Text style={styles.cancelText}>{t('app.cancel')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fffaf3' },
  container: { flexGrow: 1, padding: 24 },
  title: {
    color: '#25352d',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    color: '#25352d',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#d9ded8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#25352d',
    fontSize: 16,
    padding: 12,
  },
  sourceText: { minHeight: 180, textAlignVertical: 'top' },
  errorPanel: { marginTop: 20 },
  error: { color: '#a43b32', fontSize: 16, fontWeight: '600' },
  retry: {
    color: '#a43b32',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  extracting: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  button: {
    alignItems: 'center',
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { alignItems: 'center', marginTop: 12, padding: 12 },
  cancelText: { color: '#68736d', fontWeight: '600' },
});
