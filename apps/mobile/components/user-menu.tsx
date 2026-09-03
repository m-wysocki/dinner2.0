import { router } from 'expo-router';
import { ChevronUp, LogOut } from 'lucide-react-native';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
  subscribeToSession,
} from '@/src/auth/session';
import { useI18n } from '@/src/i18n/i18n';

export function UserMenu({ className }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<View>(null);
  const state = useSyncExternalStore(
    subscribeToSession,
    getAuthenticatedState,
  );

  useEffect(() => {
    if (!open || Platform.OS !== 'web') {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current as unknown as Node | null;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open]);

  if (!state) {
    return null;
  }

  function signOut() {
    setOpen(false);
    clearAuthenticatedState();
    router.replace('/login');
  }

  return (
    <View ref={rootRef} className={cn('relative', className)}>
      <Pressable
        accessibilityLabel={`${t('app.userMenu')}: ${state.user.email}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className={cn(
          'w-full flex-row items-center gap-2 rounded-lg px-3 py-2.5',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' }),
          open && 'bg-accent',
        )}
        onPress={() => setOpen((value) => !value)}
      >
        <Text
          numberOfLines={1}
          className="flex-1 text-[13px] text-muted-foreground"
        >
          {state.user.email}
        </Text>
        <Icon
          as={ChevronUp}
          size={16}
          className={cn('text-muted-foreground', open && 'text-foreground')}
        />
      </Pressable>
      {open && (
        <View
          accessibilityRole="menu"
          className="absolute bottom-full left-0 z-50 mb-1 w-full rounded-lg border border-border bg-popover p-1"
        >
          <Pressable
            accessibilityRole="menuitem"
            className={cn(
              'flex-row items-center gap-2 rounded-md px-3 py-2.5 active:bg-accent dark:active:bg-accent/50',
              Platform.select({
                web: 'hover:bg-accent dark:hover:bg-accent/50',
              }),
            )}
            onPress={signOut}
          >
            <Icon as={LogOut} size={16} className="text-destructive" />
            <Text className="text-[15px] font-semibold text-destructive">
              {t('app.logout')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
