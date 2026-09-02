import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { ApiError, apiClient } from '../../src/api/client';
import { formatServings, unitLabel, useI18n } from '../../src/i18n/i18n';

export default function RecipeDetails() {
  const { t, language } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiClient.getRecipe(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiClient.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      router.back();
    },
  });

  if (recipeQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <ActivityIndicator />
      </View>
    );
  }

  if (recipeQuery.isError || !recipeQuery.data) {
    const isNotFound =
      recipeQuery.error instanceof ApiError &&
      recipeQuery.error.code === 'RECIPE_NOT_FOUND';
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-[17px] font-semibold text-destructive">
          {isNotFound ? t('details.notFound') : t('details.loadFailed')}
        </Text>
        <Button className="mt-5" onPress={() => router.back()}>
          <Text className="text-base font-semibold">{t('app.back')}</Text>
        </Button>
      </View>
    );
  }

  const recipe = recipeQuery.data;
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="min-h-full p-6"
    >
      <Pressable onPress={() => router.back()}>
        <Text className="text-base text-muted-foreground">{t('app.back')}</Text>
      </Pressable>
      <View className="mt-6 flex-row items-center gap-3">
        <Text className="flex-1 text-[32px] font-bold text-foreground">
          {recipe.title}
        </Text>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => router.push(`/edit-recipe/${recipe.id}`)}
        >
          <Text className="text-sm font-semibold">{t('details.edit')}</Text>
        </Button>
      </View>
      {recipe.description && (
        <Text className="mt-3 text-base text-muted-foreground">
          {recipe.description}
        </Text>
      )}
      <Text className="mt-3 font-semibold text-brand">
        {formatServings(recipe.servingCount, language)}
      </Text>

      <Separator className="mt-7" />

      <Text className="mt-7 text-[22px] font-bold text-foreground">
        {t('details.ingredients')}
      </Text>
      <View className="mt-3">
        {recipe.ingredients?.length ? (
          recipe.ingredients.map((ingredient) => {
            const label = [
              ingredient.quantity !== null ? String(ingredient.quantity) : null,
              unitLabel(ingredient.unit, language) || null,
              ingredient.name,
            ]
              .filter((part): part is string => part !== null)
              .join(' ');

            return (
              <Text
                key={ingredient.id}
                className="text-base leading-6 text-foreground"
              >
                {label}
                {ingredient.note ? ` (${ingredient.note})` : ''}
              </Text>
            );
          })
        ) : (
          <Text className="text-muted-foreground">
            {t('details.noIngredients')}
          </Text>
        )}
      </View>

      {deleteMutation.isError && (
        <Text className="mt-7 text-[15px] text-destructive">
          {t('details.deleteFailed')} {deleteMutation.error.message}
        </Text>
      )}
      {confirmingDelete ? (
        <Card className="mt-7 rounded-lg py-4">
          <Text className="text-[17px] font-bold text-foreground">
            {t('details.deleteQuestion')}
          </Text>
          <Text className="text-muted-foreground">
            {t('details.deleteWarning')}
          </Text>
          <View className="mt-4 flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => setConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
            >
              <Text className="text-base font-semibold text-muted-foreground">
                {t('app.cancel')}
              </Text>
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onPress={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Text className="text-base font-semibold">
                {deleteMutation.isPending
                  ? t('details.deleting')
                  : t('details.delete')}
              </Text>
            </Button>
          </View>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="mt-7 border-destructive"
          onPress={() => setConfirmingDelete(true)}
          disabled={deleteMutation.isPending}
        >
          <Text className="text-base font-semibold text-destructive">
            {t('details.deleteRecipe')}
          </Text>
        </Button>
      )}
    </ScrollView>
  );
}
