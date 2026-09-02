import { Link, Redirect, router } from 'expo-router';
import { ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
} from '../src/auth/session';
import { useI18n } from '../src/i18n/i18n';

export default function User() {
  const { t } = useI18n();
  const state = getAuthenticatedState();

  if (!state) {
    return <Redirect href="/login" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow justify-center p-6"
    >
      <Text className="mt-2 text-base text-muted-foreground">
        {state.user.email}
      </Text>
      {state.user.accessStatus === 'PENDING' ? (
        <>
          <Text className="text-[28px] font-bold text-foreground">
            {t('user.titlePending')}
          </Text>
          <Text className="mt-6 text-base leading-6 text-muted-foreground">
            {t('user.messagePending')}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-[28px] font-bold text-foreground">
            {t('user.titleActive')}
          </Text>
          <Text className="mt-6 text-base leading-6 text-muted-foreground">
            {t('user.messageActive')}
          </Text>
        </>
      )}
      <Link href="/" asChild>
        <Button className="mt-8 w-full">
          <Text className="text-base font-semibold">{t('app.backToHome')}</Text>
        </Button>
      </Link>
      <Link href="/language" asChild>
        <Button className="mt-8 w-full">
          <Text className="text-base font-semibold">{t('user.language')}</Text>
        </Button>
      </Link>
      <Button
        variant="ghost"
        className="mt-5 w-full"
        onPress={() => {
          clearAuthenticatedState();
          router.replace('/login');
        }}
      >
        <Text className="text-base font-semibold text-destructive">
          {t('app.logout')}
        </Text>
      </Button>
    </ScrollView>
  );
}
