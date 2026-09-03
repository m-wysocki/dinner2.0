import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { RecipeTile } from '@/components/recipe-tile';
import { Text } from '@/components/ui/text';
import { apiClient } from '../src/api/client';
import { formatServings, useI18n } from '../src/i18n/i18n';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
} from '../src/auth/session';

export default function Index() {
  const { t, language } = useI18n();
  const authenticatedState = getAuthenticatedState();
  const isActiveUser =
    authenticatedState?.user.accessStatus === 'ACTIVE' &&
    Boolean(authenticatedState.user.emailConfirmedAt);
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.health(),
  });
  const recipesQuery = useQuery({
    queryKey: ['recipes', authenticatedState?.user.id],
    queryFn: () => apiClient.listRecipes(),
    enabled: isActiveUser,
  });

  return (
    <AppShell>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="grow items-center p-6"
      >
        <Text className="text-[36px] font-bold text-foreground">dinner2</Text>
        <Text className="mt-2 text-base text-muted-foreground">
          {t('app.subtitle')}
        </Text>

        {healthQuery.isPending && (
          <View className="mt-12 items-center">
            <ActivityIndicator />
            <Text className="mt-3 text-muted-foreground">
              {t('home.connecting')}
            </Text>
          </View>
        )}

        {healthQuery.isError && (
          <View className="mt-12 items-center">
            <Text className="text-center text-[17px] font-semibold text-destructive">
              {t('home.connectFailed')}
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              {healthQuery.error.message}
            </Text>
            <Button className="mt-5" onPress={() => void healthQuery.refetch()}>
              <Text className="text-base font-semibold">{t('app.retry')}</Text>
            </Button>
          </View>
        )}

        {healthQuery.isSuccess && (
          <View className="mt-12 items-center">
            <Text className="text-[17px] font-semibold text-brand">
              {t('home.apiWorking')}
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              {t('home.connected')}
            </Text>
          </View>
        )}

        {isActiveUser ? (
          <View className="mt-8 w-full items-center">
            <Text className="text-2xl font-bold text-foreground">
              {t('home.collection')}
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              {authenticatedState.user.email}
            </Text>
            {recipesQuery.isPending && (
              <View className="mt-6 items-center">
                <ActivityIndicator />
                <Text className="mt-3 text-muted-foreground">
                  {t('home.loadingRecipes')}
                </Text>
              </View>
            )}
            {recipesQuery.isError && (
              <View className="mt-6 items-center">
                <Text className="text-center text-[17px] font-semibold text-destructive">
                  {t('home.loadRecipesFailed')}
                </Text>
                <Text className="mt-2 text-center text-muted-foreground">
                  {recipesQuery.error.message}
                </Text>
                <Button
                  className="mt-5"
                  onPress={() => void recipesQuery.refetch()}
                >
                  <Text className="text-base font-semibold">
                    {t('app.retry')}
                  </Text>
                </Button>
              </View>
            )}
            {recipesQuery.isSuccess && recipesQuery.data.length === 0 && (
              <View className="mt-6 items-center">
                <Text className="text-lg font-semibold text-foreground">
                  {t('home.emptyTitle')}
                </Text>
                <Text className="mt-2 text-center text-muted-foreground">
                  {t('home.emptyMessage')}
                </Text>
                <Link href="/create-recipe" asChild>
                  <Button className="mt-5">
                    <Text className="text-base font-semibold">
                      {t('home.addRecipe')}
                    </Text>
                  </Button>
                </Link>
              </View>
            )}
            {recipesQuery.isSuccess && recipesQuery.data.length > 0 && (
              <View className="mt-6 w-full">
                <View className="-mx-2 -mb-2 flex-row flex-wrap">
                  {recipesQuery.data.map((recipe) => (
                    <View
                      key={recipe.id}
                      className="w-full p-2 md:w-1/2 lg:w-1/3"
                    >
                      <RecipeTile
                        title={recipe.title}
                        description={recipe.description}
                        servingsLabel={formatServings(
                          recipe.servingCount,
                          language,
                        )}
                        onPress={() => router.push(`/recipes/${recipe.id}`)}
                      />
                    </View>
                  ))}
                </View>
                <Link href="/create-recipe" asChild>
                  <Button className="mt-4 self-center">
                    <Text className="text-base font-semibold">
                      {t('home.addRecipe')}
                    </Text>
                  </Button>
                </Link>
              </View>
            )}
            <Button
              variant="ghost"
              className="mt-4"
              onPress={() => {
                clearAuthenticatedState();
                router.replace('/');
              }}
            >
              <Text className="text-[15px] font-semibold text-destructive">
                {t('app.logout')}
              </Text>
            </Button>
          </View>
        ) : authenticatedState ? (
          <View className="mt-8 w-full items-center">
            <Text className="text-2xl font-bold text-foreground">
              {t('home.accessPending')}
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              {authenticatedState.user.email}
            </Text>
            <Link href="/user" asChild>
              <Button className="mt-5">
                <Text className="text-base font-semibold">
                  {t('home.checkAccount')}
                </Text>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="mt-4"
              onPress={() => {
                clearAuthenticatedState();
                router.replace('/');
              }}
            >
              <Text className="text-[15px] font-semibold text-destructive">
                {t('app.logout')}
              </Text>
            </Button>
          </View>
        ) : (
          <>
            <Link href="/login" asChild>
              <Button className="mt-5 w-full">
                <Text className="text-base font-semibold">
                  {t('home.login')}
                </Text>
              </Button>
            </Link>
            <Link href="/register" asChild>
              <Text className="mt-3 text-center text-[15px] text-muted-foreground">
                {t('home.noAccount')}
              </Text>
            </Link>
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}
