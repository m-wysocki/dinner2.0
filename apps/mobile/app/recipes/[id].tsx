import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>{t('app.back')}</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/edit-recipe/${recipe.id}`)}
        >
          <Text style={styles.editButtonText}>{t('details.edit')}</Text>
        </Pressable>
      </View>
      {recipe.description && (
        <Text style={styles.description}>{recipe.description}</Text>
      )}
      <Text style={styles.servings}>
        {formatServings(recipe.servingCount, language)}
      </Text>

      <Text style={styles.heading}>{t('details.ingredients')}</Text>
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
            <Text key={ingredient.id} style={styles.item}>
              {label}
              {ingredient.note ? ` (${ingredient.note})` : ''}
            </Text>
          );
        })
      ) : (
        <Text style={styles.muted}>{t('details.noIngredients')}</Text>
      )}

      <Text style={styles.heading}>{t('details.preparation')}</Text>
      {recipe.preparationSteps?.length ? (
        recipe.preparationSteps.map((step, index) => (
          <View key={step.id} style={styles.step}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.item}>{step.text}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{t('details.noSteps')}</Text>
      )}

      {deleteMutation.isError && (
        <Text style={styles.deleteError}>
          {t('details.deleteFailed')} {deleteMutation.error.message}
        </Text>
      )}
      {confirmingDelete ? (
        <View style={styles.confirmPanel}>
          <Text style={styles.confirmTitle}>{t('details.deleteQuestion')}</Text>
          <Text style={styles.muted}>{t('details.deleteWarning')}</Text>
          <View style={styles.confirmActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>{t('app.cancel')}</Text>
            </Pressable>
            <Pressable
              style={styles.deleteConfirmButton}
              onPress={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Text style={styles.deleteConfirmButtonText}>
                {deleteMutation.isPending
                  ? t('details.deleting')
                  : t('details.delete')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.deleteButton}
          onPress={() => setConfirmingDelete(true)}
          disabled={deleteMutation.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {t('details.deleteRecipe')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fffaf3', minHeight: '100%' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  back: { color: '#68736d', fontSize: 16, marginBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: '#25352d', flex: 1, fontSize: 32, fontWeight: '700' },
  editButton: {
    backgroundColor: '#eef1ed',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editButtonText: { color: '#25352d', fontWeight: '600' },
  description: { color: '#68736d', fontSize: 16, marginTop: 12 },
  servings: { color: '#28734a', fontWeight: '600', marginTop: 12 },
  heading: {
    color: '#25352d',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 12,
  },
  item: { color: '#25352d', flex: 1, fontSize: 16, lineHeight: 24 },
  step: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stepNumber: { color: '#28734a', fontSize: 16, fontWeight: '700' },
  muted: { color: '#68736d' },
  error: { color: '#a43b32', fontSize: 17, fontWeight: '600' },
  button: {
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  deleteError: { color: '#a43b32', fontSize: 15, marginTop: 28 },
  confirmPanel: {
    backgroundColor: '#fff',
    borderColor: '#d9ded8',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 28,
    padding: 16,
  },
  confirmTitle: { color: '#25352d', fontSize: 17, fontWeight: '700' },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: {
    alignItems: 'center',
    borderColor: '#d9ded8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  cancelButtonText: { color: '#68736d', fontSize: 16, fontWeight: '600' },
  deleteConfirmButton: {
    alignItems: 'center',
    backgroundColor: '#a43b32',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
  },
  deleteConfirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#a43b32',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 28,
    paddingVertical: 12,
  },
  deleteButtonText: { color: '#a43b32', fontSize: 16, fontWeight: '600' },
});
