import { type RecipeResponse } from '@dinner/shared';
import { router, Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text as ButtonText } from '@/components/ui/text';
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
      <View className="flex-1 bg-background p-6">
        <Text className="pt-10 text-3xl font-bold text-foreground">
          {t('create.savedTitle')}
        </Text>
        <Text className="mt-2 text-[22px] font-semibold text-foreground">
          {savedRecipe.title}
        </Text>
        <Text className="mt-5 text-base leading-6 text-muted-foreground">
          {t('create.savedMessage', {
            servings: formatServings(
              savedRecipe.servingCount,
              language,
              'accusative',
            ),
          })}
        </Text>
        <Button onPress={() => router.replace('/')} className="mt-6">
          <ButtonText>{t('app.backToHomeScreen')}</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Text className="px-6 pt-10 text-3xl font-bold text-foreground">
        {t('review.title')}
      </Text>
      <ScrollView className="max-h-[260px] grow-0 px-6">
        <View className="mt-4 rounded-lg border border-panel-border bg-secondary p-3.5">
          <Text className="text-[15px] font-bold text-panel-label">
            {t('review.originalRecipe')}
          </Text>
          <Text className="mt-1 text-[13px] text-panel-hint">
            {t('review.originalHint')}
          </Text>
          <Text className="mt-2 text-[15px] leading-[22px] text-secondary-foreground">
            {stored.sourceText}
          </Text>
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
