import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient, ApiError } from '../../src/api/client';
import { getAuthenticatedState } from '../../src/auth/session';
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

  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt) {
    return <Redirect href="/user" />;
  }

  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiClient.getRecipe(id),
    enabled: Boolean(id),
  });

  if (recipeQuery.isPending) {
    return <ActivityIndicator style={styles.centered} />;
  }

  if (recipeQuery.isError || !recipeQuery.data) {
    const isNotFound =
      recipeQuery.error instanceof ApiError &&
      recipeQuery.error.code === 'RECIPE_NOT_FOUND';
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {isNotFound ? t('details.notFound') : t('details.loadFailed')}
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>{t('app.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const recipe = recipeQuery.data;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('edit.title')}</Text>
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
          preparationSteps: recipe.preparationSteps.map((step) => step.text),
        }}
        submitLabel={t('edit.submit')}
        onSubmit={async (input) => {
          await apiClient.updateRecipe(recipe.id, {
            title: input.title,
            description: input.description,
            servingCount: input.servingCount,
            ingredients: input.ingredients ?? [],
            preparationSteps: input.preparationSteps ?? [],
          });
          queryClient.invalidateQueries({ queryKey: ['recipe', recipe.id] });
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
          router.back();
        }}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf3' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#25352d',
    fontSize: 30,
    fontWeight: '700',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  error: { color: '#a43b32', fontSize: 17, fontWeight: '600' },
  button: {
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
