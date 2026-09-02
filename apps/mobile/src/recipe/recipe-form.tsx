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
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
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
  const colorScheme = useColorScheme();
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow p-6"
    >
      <Label className="mb-2 mt-4 text-[15px] font-semibold">
        {t('form.title')}
      </Label>
      <Input
        accessibilityLabel={t('form.title')}
        autoCapitalize="sentences"
        className="rounded-lg bg-card p-3"
        onChangeText={setTitle}
        placeholder={t('form.titlePlaceholder')}
        value={title}
      />
      <Label className="mb-2 mt-4 text-[15px] font-semibold">
        {t('form.description')}
      </Label>
      <Input
        accessibilityLabel={t('form.description')}
        className="h-auto min-h-24 rounded-lg bg-card p-3"
        multiline
        onChangeText={setDescription}
        placeholder={t('form.descriptionPlaceholder')}
        textAlignVertical="top"
        value={description}
      />
      <Label className="mb-2 mt-4 text-[15px] font-semibold">
        {t('form.servingCount')}
      </Label>
      <Input
        accessibilityLabel={t('form.servingCount')}
        className="rounded-lg bg-card p-3"
        keyboardType="number-pad"
        onChangeText={setServingCount}
        placeholder={t('form.servingCountPlaceholder')}
        value={servingCount}
      />
      <Text className="mt-6 text-xl font-bold text-foreground">
        {t('form.ingredients')}
      </Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} className="mt-2">
          <Input
            accessibilityLabel={t('form.ingredientNameA11y', {
              number: index + 1,
            })}
            className="rounded-lg bg-card p-3"
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
            value={ingredient.name}
          />
          <Input
            accessibilityLabel={t('form.ingredientQuantityA11y', {
              number: index + 1,
            })}
            className="mt-1.5 rounded-lg bg-card p-3"
            onChangeText={(quantity) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, quantity } : item,
                ),
              )
            }
            placeholder={t('form.quantityPlaceholder')}
            value={ingredient.quantity}
          />
          <Input
            accessibilityLabel={t('form.ingredientNoteA11y', {
              number: index + 1,
            })}
            className="mt-1.5 rounded-lg bg-card p-3"
            onChangeText={(note) =>
              setIngredients((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, note } : item,
                ),
              )
            }
            placeholder={t('form.notePlaceholder')}
            value={ingredient.note}
          />
          {!ingredient.catalogEntryId && ingredient.customProposal && (
            <View className="mt-2 rounded-lg border border-panel-border bg-secondary p-2.5">
              <Text className="text-[13px] font-bold text-panel-label">
                {t('review.proposalLabel')}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-panel-hint">
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
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            {UNITS.map((unit) => {
              const selected = ingredient.unit === unit;
              return (
                <Button
                  key={unit}
                  variant="secondary"
                  size="sm"
                  className={cn('bg-muted', selected && 'bg-accent')}
                  onPress={() =>
                    setIngredients((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, unit } : item,
                      ),
                    )
                  }
                >
                  <Text>{unitLabel(unit, language)}</Text>
                </Button>
              );
            })}
          </View>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            {catalog.map((entry) => {
              const selected = ingredient.catalogEntryId === entry.id;
              return (
                <Button
                  key={entry.id}
                  variant="secondary"
                  size="sm"
                  className={cn('bg-muted', selected && 'bg-accent')}
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
                >
                  <Text>
                    {localizedName(entry.namePl, entry.nameEn, language)}
                  </Text>
                </Button>
              );
            })}
          </View>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            <Button
              variant="secondary"
              size="sm"
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
            >
              <Text>{t('form.moveUp')}</Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
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
            >
              <Text>{t('form.moveDown')}</Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void saveAsNew(index)}
            >
              <Text>{t('form.saveAsNewIngredient')}</Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() =>
                setIngredients((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Text>{t('form.removeIngredient')}</Text>
            </Button>
          </View>
        </View>
      ))}
      <Button
        variant="outline"
        className="mt-3 w-full border-foreground py-3"
        onPress={() =>
          setIngredients((current) => [
            ...current,
            { name: '', quantity: '', unit: 'PCS', note: '' },
          ])
        }
      >
        <Text className="text-base font-semibold">
          {t('form.addIngredient')}
        </Text>
      </Button>
      <Input
        accessibilityLabel={t('form.customIngredientA11y')}
        className="mt-3 rounded-lg bg-card p-3"
        onChangeText={setCustomName}
        placeholder={t('form.customIngredientPlaceholder')}
        value={customName}
      />
      <Button
        variant="outline"
        className="mt-3 w-full border-foreground py-3"
        onPress={() => void addCustomIngredient()}
      >
        <Text className="text-base font-semibold">
          {t('form.createCustomIngredient')}
        </Text>
      </Button>
      {error && <Text className="mt-4 text-destructive">{error}</Text>}
      <Button
        className="mt-6 py-3.5"
        disabled={isSaving}
        onPress={() => void save()}
      >
        {isSaving ? (
          <ActivityIndicator
            color={THEME[colorScheme ?? 'light'].primaryForeground}
          />
        ) : (
          <Text className="text-base font-semibold">{submitLabel}</Text>
        )}
      </Button>
      <Button
        variant="ghost"
        className="mt-3"
        disabled={isSaving}
        onPress={onCancel}
      >
        <Text className="font-semibold text-muted-foreground">
          {t('app.cancel')}
        </Text>
      </Button>
    </ScrollView>
  );
}
