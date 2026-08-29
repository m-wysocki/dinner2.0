import { type RecipeResponse } from '@dinner/shared';
import { router, Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';
import { RecipeForm } from '../src/recipe/recipe-form';

export default function CreateRecipe() {
  const state = getAuthenticatedState();
  const [savedRecipe, setSavedRecipe] = useState<RecipeResponse | null>(null);

  if (!state) {
    return <Redirect href="/login" />;
  }

  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt) {
    return <Redirect href="/user" />;
  }

  if (savedRecipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Przepis zapisany</Text>
        <Text style={styles.savedTitle}>{savedRecipe.title}</Text>
        <Text style={styles.savedMessage}>
          Przepis na {savedRecipe.servingCount} porcji został dodany do Twojej
          kolekcji.
        </Text>
        <Pressable onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>Wróć do strony głównej</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nowy przepis</Text>
      <RecipeForm
        initialValues={{
          title: '',
          description: '',
          servingCount: '',
          ingredients: [],
          preparationSteps: [],
        }}
        submitLabel="Zapisz przepis"
        onSubmit={async (input) => {
          const body =
            (input.ingredients?.length ?? 0) === 0 &&
            (input.preparationSteps?.length ?? 0) === 0
              ? {
                  title: input.title,
                  description: input.description,
                  servingCount: input.servingCount,
                }
              : input;
          setSavedRecipe(await apiClient.createRecipe(body));
        }}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf3' },
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
  button: {
    alignItems: 'center',
    backgroundColor: '#25352d',
    borderRadius: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
