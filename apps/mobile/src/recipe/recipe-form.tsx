import {
  createRecipeRequestSchema,
  type CanonicalUnit,
  type CreateRecipeRequest,
  type CustomIngredientProposal,
  type ExtractRecipeDraft,
  type IngredientCatalogEntry,
  type InterfaceLanguage,
} from '@dinner/shared';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiClient } from '../api/client';
import { unitLabel, useI18n } from '../i18n/i18n';

export interface RecipeFormValues {
  title: string;
  description: string;
  servingCount: string;
  ingredients: Array<{
    catalogEntryId?: string;
    name: string;
    quantity: string;
    unit: CanonicalUnit;
    note: string;
    customProposal?: CustomIngredientProposal | null;
  }>;
}

export function recipeFormValuesFromDraft(
  draft: ExtractRecipeDraft,
): RecipeFormValues {
  return {
    title: draft.title,
    description: draft.description,
    servingCount: String(draft.servingCount),
    ingredients: draft.ingredients.map((ingredient) => ({
      catalogEntryId: ingredient.catalogEntryId ?? undefined,
      name: ingredient.name,
      quantity: ingredient.quantity ?? '',
      unit: ingredient.unit,
      note: ingredient.note ?? '',
      customProposal: ingredient.customProposal,
    })),
  };
}

interface RecipeFormProps {
  initialValues: RecipeFormValues;
  submitLabel: string;
  onSubmit: (input: CreateRecipeRequest) => Promise<void>;
  onCancel: () => void;
}

const UNITS: CanonicalUnit[] = [
  'G',
  'KG',
  'ML',
  'L',
  'PCS',
  'TSP',
  'TBSP',
  'OTHER',
];

function localizedName(
  namePl: string,
  nameEn: string,
  language: InterfaceLanguage,
): string {
  return language === 'en' ? nameEn : namePl;
}

export function RecipeForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: RecipeFormProps) {
  const { t, language } = useI18n();
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [servingCount, setServingCount] = useState(initialValues.servingCount);
  const [ingredients, setIngredients] = useState(initialValues.ingredients);
  const [catalog, setCatalog] = useState<IngredientCatalogEntry[]>([]);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void apiClient
      .ingredientCatalog()
      .then(setCatalog)
      .catch(() => undefined);
  }, []);

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
    });

    if (!parsed.success) {
      const hasMissingIdentity = parsed.error.issues.some(
        (issue) => issue.path.at(-1) === 'catalogEntryId',
      );
      const hasInvalidQuantity = parsed.error.issues.some(
        (issue) => issue.path.at(-1) === 'quantity',
      );
      setError(
        hasMissingIdentity
          ? t('form.errorIdentity')
          : hasInvalidQuantity
            ? t('form.errorQuantity')
            : t('form.errorBasics'),
      );
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(parsed.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('form.saveFailed'));
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
          : t('form.addIngredientFailed'),
      );
    }
  }

  async function saveAsNew(index: number) {
    const name = ingredients[index].name.trim();
    if (!name) {
      return;
    }
    try {
      const entry = await apiClient.createCustomIngredient({ name });
      setCatalog((current) => [...current, entry]);
      setIngredients((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, catalogEntryId: entry.id, customProposal: null }
            : item,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t('form.addIngredientFailed'),
      );
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t('form.title')}</Text>
      <TextInput
        accessibilityLabel={t('form.title')}
        autoCapitalize="sentences"
        onChangeText={setTitle}
        placeholder={t('form.titlePlaceholder')}
        style={styles.input}
        value={title}
      />
      <Text style={styles.label}>{t('form.description')}</Text>
      <TextInput
        accessibilityLabel={t('form.description')}
        multiline
        onChangeText={setDescription}
        placeholder={t('form.descriptionPlaceholder')}
        style={[styles.input, styles.description]}
        value={description}
      />
      <Text style={styles.label}>{t('form.servingCount')}</Text>
      <TextInput
        accessibilityLabel={t('form.servingCount')}
        keyboardType="number-pad"
        onChangeText={setServingCount}
        placeholder={t('form.servingCountPlaceholder')}
        style={styles.input}
        value={servingCount}
      />
      <Text style={styles.sectionTitle}>{t('form.ingredients')}</Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredient}>
          <TextInput
            accessibilityLabel={t('form.ingredientNameA11y', {
              number: index + 1,
            })}
            onChangeText={(name) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index
                    ? {
                        ...item,
                        name,
                        customProposal: item.customProposal
                          ? {
                              ...item.customProposal,
                              namePl: name,
                              nameEn: name,
                            }
                          : item.customProposal,
                      }
                    : item,
                ),
              )
            }
            placeholder={t('form.ingredientName')}
            style={styles.input}
            value={ingredient.name}
          />
          <TextInput
            accessibilityLabel={t('form.ingredientQuantityA11y', {
              number: index + 1,
            })}
            onChangeText={(quantity) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, quantity } : item,
                ),
              )
            }
            placeholder={t('form.quantityPlaceholder')}
            style={styles.input}
            value={ingredient.quantity}
          />
          <TextInput
            accessibilityLabel={t('form.ingredientNoteA11y', {
              number: index + 1,
            })}
            onChangeText={(note) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, note } : item,
                ),
              )
            }
            placeholder={t('form.notePlaceholder')}
            style={styles.input}
            value={ingredient.note}
          />
          {!ingredient.catalogEntryId && ingredient.customProposal && (
            <View style={styles.proposal}>
              <Text style={styles.proposalLabel}>
                {t('review.proposalLabel')}
              </Text>
              <Text style={styles.proposalText}>
                {t('review.proposalText', {
                  name: localizedName(
                    ingredient.customProposal.namePl,
                    ingredient.customProposal.nameEn,
                    language,
                  ),
                })}
              </Text>
            </View>
          )}
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
                <Text>{unitLabel(unit, language)}</Text>
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
                        ? {
                            ...item,
                            catalogEntryId: entry.id,
                            customProposal: null,
                          }
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
                  {localizedName(entry.namePl, entry.nameEn, language)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.ingredientActions}>
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
              <Text>{t('form.moveUp')}</Text>
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
              <Text>{t('form.moveDown')}</Text>
            </Pressable>
            <Pressable
              onPress={() => void saveAsNew(index)}
              style={styles.action}
            >
              <Text>{t('form.saveAsNewIngredient')}</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setIngredients((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              style={styles.action}
            >
              <Text>{t('form.removeIngredient')}</Text>
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
        <Text>{t('form.addIngredient')}</Text>
      </Pressable>
      <TextInput
        accessibilityLabel={t('form.customIngredientA11y')}
        onChangeText={setCustomName}
        placeholder={t('form.customIngredientPlaceholder')}
        style={[styles.input, styles.customInput]}
        value={customName}
      />
      <Pressable
        onPress={() => void addCustomIngredient()}
        style={styles.secondaryButton}
      >
        <Text>{t('form.createCustomIngredient')}</Text>
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
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
      <Pressable disabled={isSaving} onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>{t('app.cancel')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fffaf3' },
  container: { flexGrow: 1, padding: 24 },
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
  proposal: {
    backgroundColor: '#fdf3e3',
    borderColor: '#e0c98a',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
  proposalText: {
    color: '#6b5a2e',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  proposalLabel: { color: '#6b5a2e', fontSize: 13, fontWeight: '700' },
  ingredientActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
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
