import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../../src/api/client';

export default function RecipeDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeQuery = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => apiClient.getRecipe(id),
    enabled: Boolean(id),
  });

  if (recipeQuery.isPending) {
    return <ActivityIndicator style={styles.centered} />;
  }

  if (recipeQuery.isError || !recipeQuery.data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Nie znaleziono przepisu.</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Wróć</Text>
        </Pressable>
      </View>
    );
  }

  const recipe = recipeQuery.data;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>Wróć</Text>
      </Pressable>
      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.description && (
        <Text style={styles.description}>{recipe.description}</Text>
      )}
      <Text style={styles.servings}>{recipe.servingCount} porcji</Text>

      <Text style={styles.heading}>Składniki</Text>
      {recipe.ingredients?.length ? (
        recipe.ingredients.map((ingredient) => (
          <Text key={ingredient.id} style={styles.item}>
            {ingredient.quantity === null ? '' : `${ingredient.quantity} `}
            {ingredient.unit} {ingredient.name}
            {ingredient.note ? ` (${ingredient.note})` : ''}
          </Text>
        ))
      ) : (
        <Text style={styles.muted}>Brak składników.</Text>
      )}

      <Text style={styles.heading}>Przygotowanie</Text>
      {recipe.preparationSteps?.length ? (
        recipe.preparationSteps.map((step, index) => (
          <View key={step.id} style={styles.step}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.item}>{step.text}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>Brak kroków przygotowania.</Text>
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
  title: { color: '#25352d', fontSize: 32, fontWeight: '700' },
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
});
