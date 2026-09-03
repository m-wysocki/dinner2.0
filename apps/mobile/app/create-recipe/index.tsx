import { extractRecipeRequestSchema } from '@dinner/shared';
import { router, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  View,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { ApiError, apiClient } from '../../src/api/client';
import { getAuthenticatedState } from '../../src/auth/session';
import { useI18n } from '../../src/i18n/i18n';
import { setCreateDraft } from '../../src/recipe/create-draft';

export default function CreateRecipe() {
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const state = getAuthenticatedState();
  const [title, setTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [servingCount, setServingCount] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) {
    return <Redirect href="/login" />;
  }

  if (state.user.accessStatus !== 'ACTIVE' || !state.user.emailConfirmedAt) {
    return <Redirect href="/user" />;
  }

  async function extract() {
    const parsed = extractRecipeRequestSchema.safeParse({
      title: title.trim(),
      sourceText: sourceText.trim(),
      servingCount: Number(servingCount),
    });

    if (!parsed.success) {
      setError(t('create.inputRequired'));
      return;
    }

    setError(null);
    setIsExtracting(true);
    try {
      const draft = await apiClient.extractRecipe(parsed.data);
      setCreateDraft({ draft, sourceText: parsed.data.sourceText });
      router.push('/create-recipe/review');
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'EXTRACTION_FAILED') {
        setError(t('create.extractFailed'));
      } else {
        setError(
          caught instanceof Error ? caught.message : t('create.extractFailed'),
        );
      }
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <AppShell>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="grow p-6"
      >
        <Text className="mb-2 text-[30px] font-bold text-foreground">
          {t('create.title')}
        </Text>
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
          {t('create.sourceTextLabel')}
        </Label>
        <Input
          accessibilityLabel={t('create.sourceTextLabel')}
          autoCapitalize="sentences"
          className="h-auto min-h-[180px] rounded-lg bg-card p-3"
          maxLength={20000}
          multiline
          onChangeText={setSourceText}
          placeholder={t('create.sourceTextPlaceholder')}
          textAlignVertical="top"
          value={sourceText}
        />
        <Label className="mb-2 mt-4 text-[15px] font-semibold">
          {t('create.servingCount')}
        </Label>
        <Input
          accessibilityLabel={t('create.servingCount')}
          className="rounded-lg bg-card p-3"
          keyboardType="number-pad"
          onChangeText={setServingCount}
          placeholder={t('create.servingCountPlaceholder')}
          value={servingCount}
        />
        {error && (
          <View className="mt-5">
            <Text className="text-base font-semibold text-destructive">
              {error}
            </Text>
            <Button
              variant="link"
              className="mt-3 self-start"
              disabled={isExtracting}
              onPress={() => void extract()}
            >
              <Text className="text-[15px] font-bold text-destructive underline">
                {t('app.retry')}
              </Text>
            </Button>
          </View>
        )}
        <Button
          className="mt-6 py-3.5"
          disabled={isExtracting}
          onPress={() => void extract()}
        >
          {isExtracting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator
                color={THEME[colorScheme ?? 'light'].primaryForeground}
              />
              <Text className="text-base font-semibold">
                {t('create.extracting')}
              </Text>
            </View>
          ) : (
            <Text className="text-base font-semibold">
              {t('create.extract')}
            </Text>
          )}
        </Button>
        <Button
          variant="ghost"
          className="mt-3"
          disabled={isExtracting}
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-muted-foreground">
            {t('app.cancel')}
          </Text>
        </Button>
      </ScrollView>
    </AppShell>
  );
}
