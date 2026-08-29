import {
  createRecipeRequestSchema,
  type IngredientCatalogEntry,
  type RecipeResponse,
} from '@dinner/shared';
import { router, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';

interface DraftIngredient {
  catalogEntryId?: string;
  name: string;
  quantity: string;
  unit: 'G' | 'KG' | 'ML' | 'L' | 'PCS' | 'TSP' | 'TBSP' | 'OTHER';
  note: string;
}

const UNITS = ['G', 'KG', 'ML', 'L', 'PCS', 'TSP', 'TBSP', 'OTHER'] as const;

export default function CreateRecipe() {
  const state = getAuthenticatedState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servingCount, setServingCount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecipe, setSavedRecipe] = useState<RecipeResponse | null>(null);
  const [catalog, setCatalog] = useState<IngredientCatalogEntry[]>([]);
  const [customName, setCustomName] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [preparationSteps, setPreparationSteps] = useState<string[]>([]);

  useEffect(() => {
    void apiClient
      .ingredientCatalog()
      .then(setCatalog)
      .catch(() => undefined);
  }, []);

  if (!state) {
    return <Redirect href="/login" />;
  }

  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt) {
    return <Redirect href="/user" />;
  }

  async function save() {
    const parsed = createRecipeRequestSchema.safeParse({
      title,
      description: description.trim() || undefined,
      servingCount: Number(servingCount),
      ingredients: ingredients.map((ingredient, position) => ({
        ...ingredient,
        catalogEntryId: ingredient.catalogEntryId ?? '',
        quantity: ingredient.quantity.trim() || null,
        note: ingredient.note.trim() || undefined,
        position,
      })),
      preparationSteps: preparationSteps.map((text, position) => ({
        text,
        position,
      })),
    });

    if (!parsed.success) {
      const hasMissingIdentity = parsed.error.issues.some(
        (issue) => issue.path.at(-1) === 'catalogEntryId',
      );
      const hasInvalidQuantity = parsed.error.issues.some(
        (issue) => issue.path.at(-1) === 'quantity',
      );
      const hasInvalidStep = parsed.error.issues.some(
        (issue) => issue.path[0] === 'preparationSteps',
      );
      setError(
        hasMissingIdentity
          ? 'Wybierz kanoniczny składnik z katalogu dla każdej pozycji.'
          : hasInvalidQuantity
            ? 'Podaj ilość jako liczbę, maksymalnie z sześcioma miejscami po przecinku, albo zostaw ją pustą.'
            : hasInvalidStep
              ? 'Każdy krok przygotowania musi zawierać treść.'
              : 'Podaj tytuł i prawidłową liczbę porcji.',
      );
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const input =
        (parsed.data.ingredients?.length ?? 0) === 0 &&
        (parsed.data.preparationSteps?.length ?? 0) === 0
          ? {
              title: parsed.data.title,
              description: parsed.data.description,
              servingCount: parsed.data.servingCount,
            }
          : parsed.data;
      setSavedRecipe(await apiClient.createRecipe(input));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Nie udało się zapisać przepisu.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function addCustomIngredient() {
    if (!customName.trim()) {
      return;
    }
    try {
      const entry = await apiClient.createCustomIngredient({
        name: customName,
      });
      setCatalog((current) => [...current, entry]);
      setCustomName('');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Nie udało się dodać składnika.',
      );
    }
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
      <Text style={styles.label}>Tytuł</Text>
      <TextInput
        accessibilityLabel="Tytuł"
        autoCapitalize="sentences"
        onChangeText={setTitle}
        placeholder="Np. Zupa pomidorowa"
        style={styles.input}
        value={title}
      />
      <Text style={styles.label}>Opis (opcjonalnie)</Text>
      <TextInput
        accessibilityLabel="Opis"
        multiline
        onChangeText={setDescription}
        placeholder="Kilka słów o przepisie"
        style={[styles.input, styles.description]}
        value={description}
      />
      <Text style={styles.label}>Liczba porcji</Text>
      <TextInput
        accessibilityLabel="Liczba porcji"
        keyboardType="number-pad"
        onChangeText={setServingCount}
        placeholder="Np. 4"
        style={styles.input}
        value={servingCount}
      />
      <Text style={styles.sectionTitle}>Składniki</Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredient}>
          <TextInput
            accessibilityLabel={`Nazwa składnika ${index + 1}`}
            onChangeText={(name) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, name } : item,
                ),
              )
            }
            placeholder="Nazwa składnika"
            style={styles.input}
            value={ingredient.name}
          />
          <TextInput
            accessibilityLabel={`Ilość składnika ${index + 1}`}
            onChangeText={(quantity) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, quantity } : item,
                ),
              )
            }
            placeholder="Ilość, np. 2 (opcjonalnie)"
            style={styles.input}
            value={ingredient.quantity}
          />
          <TextInput
            accessibilityLabel={`Notatka składnika ${index + 1}`}
            onChangeText={(note) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, note } : item,
                ),
              )
            }
            placeholder="Notatka (opcjonalnie)"
            style={styles.input}
            value={ingredient.note}
          />
          <View style={styles.catalog}>
            {UNITS.map((unit) => (
              <Pressable
                key={unit}
                onPress={() =>
                  setIngredients((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, unit } : item,
                    ),
                  )
                }
                style={
                  ingredient.unit === unit
                    ? styles.selected
                    : styles.catalogEntry
                }
              >
                <Text>{unit}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.catalog}>
            {catalog.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() =>
                  setIngredients((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, catalogEntryId: entry.id }
                        : item,
                    ),
                  )
                }
                style={
                  ingredient.catalogEntryId === entry.id
                    ? styles.selected
                    : styles.catalogEntry
                }
              >
                <Text>
                  {state.user.interfaceLanguage === 'en'
                    ? entry.nameEn
                    : entry.namePl}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.stepActions}>
            <Pressable
              disabled={index === 0}
              onPress={() =>
                setIngredients((current) => {
                  const next = [...current];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  return next;
                })
              }
              style={styles.action}
            >
              <Text>W górę</Text>
            </Pressable>
            <Pressable
              disabled={index === ingredients.length - 1}
              onPress={() =>
                setIngredients((current) => {
                  const next = [...current];
                  [next[index], next[index + 1]] = [
                    next[index + 1],
                    next[index],
                  ];
                  return next;
                })
              }
              style={styles.action}
            >
              <Text>W dół</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setIngredients((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              style={styles.action}
            >
              <Text>Usuń składnik</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable
        onPress={() =>
          setIngredients((current) => [
            ...current,
            { name: '', quantity: '', unit: 'PCS', note: '' },
          ])
        }
        style={styles.secondaryButton}
      >
        <Text>Dodaj składnik</Text>
      </Pressable>
      <TextInput
        accessibilityLabel="Nazwa własnego składnika"
        onChangeText={setCustomName}
        placeholder="Nowy własny składnik"
        style={[styles.input, styles.customInput]}
        value={customName}
      />
      <Pressable
        onPress={() => void addCustomIngredient()}
        style={styles.secondaryButton}
      >
        <Text>Utwórz własny składnik</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Przygotowanie</Text>
      {preparationSteps.map((step, index) => (
        <View key={index} style={styles.step}>
          <TextInput
            accessibilityLabel={`Krok przygotowania ${index + 1}`}
            multiline
            onChangeText={(text) =>
              setPreparationSteps((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? text : item,
                ),
              )
            }
            placeholder="Opisz krok przygotowania"
            style={[styles.input, styles.description]}
            value={step}
          />
          <View style={styles.stepActions}>
            <Pressable
              disabled={index === 0}
              onPress={() =>
                setPreparationSteps((current) => {
                  const next = [...current];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  return next;
                })
              }
              style={styles.action}
            >
              <Text>W górę</Text>
            </Pressable>
            <Pressable
              disabled={index === preparationSteps.length - 1}
              onPress={() =>
                setPreparationSteps((current) => {
                  const next = [...current];
                  [next[index], next[index + 1]] = [
                    next[index + 1],
                    next[index],
                  ];
                  return next;
                })
              }
              style={styles.action}
            >
              <Text>W dół</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setPreparationSteps((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              style={styles.action}
            >
              <Text>Usuń krok</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable
        onPress={() => setPreparationSteps((current) => [...current, ''])}
        style={styles.secondaryButton}
      >
        <Text>Dodaj krok</Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        disabled={isSaving}
        onPress={() => void save()}
        style={styles.button}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Zapisz przepis</Text>
        )}
      </Pressable>
      <Pressable
        disabled={isSaving}
        onPress={() => router.back()}
        style={styles.cancel}
      >
        <Text style={styles.cancelText}>Anuluj</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fffaf3' },
  title: {
    color: '#25352d',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 28,
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
  description: { minHeight: 96, textAlignVertical: 'top' },
  sectionTitle: {
    color: '#25352d',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
  },
  ingredient: { marginTop: 8 },
  catalog: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  catalogEntry: { backgroundColor: '#eef1ed', borderRadius: 6, padding: 6 },
  selected: { backgroundColor: '#b7d7bf', borderRadius: 6, padding: 6 },
  step: { marginTop: 8 },
  stepActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  action: { backgroundColor: '#eef1ed', borderRadius: 6, padding: 8 },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#25352d',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  customInput: { marginTop: 12 },
  error: { color: '#a43b32', marginTop: 16 },
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
  cancel: { alignItems: 'center', marginTop: 12, padding: 12 },
  cancelText: { color: '#68736d', fontWeight: '600' },
});