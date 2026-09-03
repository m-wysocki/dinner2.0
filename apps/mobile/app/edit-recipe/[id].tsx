import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Text } from '@/components/ui/text';
import { apiClient, ApiError } from '../../src/api/client';
import { getAuthenticatedState } from '../../src/auth/session';
import { isAccessActive } from '../../src/auth/access';
import { useI18n } from '../../src/i18n/i18n';
import { RecipeForm } from '../../src/recipe/recipe-form';

export default function EditRecipe() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const state = getAuthenticatedState();

  if (!state) {
    return <Redirect href="/login" />;
  }

  if (!isAccessActive(state)) {
    return <Redirect href="/user" />;
  }

  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiClient.getRecipe(id),
    enabled: Boolean(id),
  });

  if (recipeQuery.isPending) {
    return (
      <AppShell>
        <View className="flex-1 items-center justify-center bg-background p-6">
          <ActivityIndicator />
        </View>
      </AppShell>
    );
  }

  if (recipeQuery.isError || !recipeQuery.data) {
    const isNotFound =
      recipeQuery.error instanceof ApiError &&
      recipeQuery.error.code === 'RECIPE_NOT_FOUND';
    return (
      <AppShell>
        <View className="flex-1 items-center justify-center bg-background p-6">
          <Text className="text-[17px] font-semibold text-destructive">
            {isNotFound ? t('details.notFound') : t('details.loadFailed')}
          </Text>
          <Button className="mt-5" onPress={() => router.back()}>
            <Text className="text-base font-semibold">{t('app.back')}</Text>
          </Button>
        </View>
      </AppShell>
    );
  }

  const recipe = recipeQuery.data;
  return (
    <AppShell>
      <View className="flex-1 bg-background">
        <Text className="px-6 pt-10 text-[30px] font-bold text-foreground">
          {t('edit.title')}
        </Text>
        <RecipeForm
          initialValues={{
            title: recipe.title,
            description: recipe.description ?? '',
            servingCount: String(recipe.servingCount),
            ingredients: recipe.ingredients.map((ingredient) => ({
              catalogEntryId: ingredient.catalogEntryId,
              name: ingredient.name,
              quantity: ingredient.quantity ?? '',
              unit: ingredient.unit,
              note: ingredient.note ?? '',
            })),
          }}
          submitLabel={t('edit.submit')}
          onSubmit={async (input) => {
            await apiClient.updateRecipe(recipe.id, {
              title: input.title,
              description: input.description,
              servingCount: input.servingCount,
              ingredients: input.ingredients ?? [],
            });
            queryClient.invalidateQueries({ queryKey: ['recipe', recipe.id] });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            router.back();
          }}
          onCancel={() => router.back()}
        />
      </View>
    </AppShell>
  );
}
