import { type RecipeResponse } from '@dinner/shared';
import { router, Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiClient } from '../../src/api/client';
import { getAuthenticatedState } from '../../src/auth/session';
import { formatServings, useI18n } from '../../src/i18n/i18n';
import {
  clearCreateDraft,
  getCreateDraft,
} from '../../src/recipe/create-draft';
import {
  RecipeForm,
  recipeFormValuesFromDraft,
} from '../../src/recipe/recipe-form';

export default function CreateReview() {
  const { t, language } = useI18n();
  const state = getAuthenticatedState();
  const [savedRecipe, setSavedRecipe] = useState<RecipeResponse | null>(null);

  if (!state) {
    return <Redirect href="/login" />;
  }

  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt) {
    return <Redirect href="/user" />;
  }

  const stored = getCreateDraft();

  if (!stored) {
    return <Redirect href="/create-recipe" />;
  }

  if (savedRecipe) {
    return (
      <View style={styles.savedContainer}>
        <Text style={styles.title}>{t('create.savedTitle')}</Text>
        <Text style={styles.savedTitle}>{savedRecipe.title}</Text>
        <Text style={styles.savedMessage}>
          {t('create.savedMessage', {
            servings: formatServings(
              savedRecipe.servingCount,
              language,
              'accusative',
            ),
          })}
        </Text>
        <Pressable onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>{t('app.backToHomeScreen')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('review.title')}</Text>
      <ScrollView style={styles.originalScroll}>
        <View style={styles.originalPanel}>
          <Text style={styles.originalLabel}>{t('review.originalRecipe')}</Text>
          <Text style={styles.originalHint}>{t('review.originalHint')}</Text>
          <Text style={styles.originalText}>{stored.sourceText}</Text>
        </View>
      </ScrollView>
      <RecipeForm
        initialValues={recipeFormValuesFromDraft(stored.draft)}
        submitLabel={t('create.submit')}
        onSubmit={async (input) => {
          const saved = await apiClient.createRecipe({
            ...input,
            sourceText: stored.sourceText,
          });
          clearCreateDraft();
          setSavedRecipe(saved);
        }}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf3' },
  savedContainer: { flex: 1, backgroundColor: '#fffaf3', padding: 24 },
  title: {
    color: '#25352d',
    fontSize: 30,
    fontWeight: '700',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  savedTitle: {
    color: '#25352d',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 8,
  },
  savedMessage: {
    color: '#68736d',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 20,
  },
  originalScroll: {
    flexGrow: 0,
    maxHeight: 260,
    paddingHorizontal: 24,
  },
  originalPanel: {
    backgroundColor: '#fdf6e9',
    borderColor: '#e6d5a8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  originalLabel: {
    color: '#6b5a2e',
    fontSize: 15,
    fontWeight: '700',
  },
  originalHint: {
    color: '#8a7a4d',
    fontSize: 13,
    marginTop: 4,
  },
  originalText: {
    color: '#4c463a',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
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
