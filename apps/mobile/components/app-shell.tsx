import { Link, usePathname, type Href } from 'expo-router';
import { BookOpen, Plus, UserRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { LanguageToggle } from '@/components/language-toggle';
import { UserMenu } from '@/components/user-menu';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { isAccessActive } from '@/src/auth/access';
import { getAuthenticatedState } from '@/src/auth/session';
import { useI18n, type TranslationKey } from '@/src/i18n/i18n';

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.collection', icon: BookOpen },
  { href: '/create-recipe', labelKey: 'nav.addRecipe', icon: Plus },
  { href: '/user', labelKey: 'nav.user', icon: UserRound },
] as const satisfies ReadonlyArray<{
  href: Href;
  labelKey: TranslationKey;
  icon: LucideIcon;
}>;

const SCREEN_TITLES = [
  { prefix: '/create-recipe/review', titleKey: 'review.title' },
  { prefix: '/create-recipe', titleKey: 'create.title' },
  { prefix: '/edit-recipe', titleKey: 'edit.title' },
  { prefix: '/recipes', titleKey: 'details.title' },
  { prefix: '/user', titleKey: 'nav.user' },
  { prefix: '/', titleKey: 'nav.collection' },
] as const satisfies ReadonlyArray<{
  prefix: string;
  titleKey: TranslationKey;
}>;

function isActive(pathname: string, href: Href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function screenTitleKey(pathname: string): TranslationKey {
  return (
    SCREEN_TITLES.find(
      (entry) => pathname === entry.prefix || pathname.startsWith(entry.prefix),
    )?.titleKey ?? 'nav.collection'
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  iconSize,
  className,
  textClassName,
}: {
  href: Href;
  label: string;
  icon: LucideIcon;
  active: boolean;
  iconSize: number;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        className={className}
      >
        <Icon
          as={icon}
          size={iconSize}
          className={active ? 'text-brand' : 'text-muted-foreground'}
        />
        <Text
          className={cn(
            textClassName,
            active ? 'font-semibold text-foreground' : 'text-muted-foreground',
          )}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

type NavItemConfig = (typeof NAV_ITEMS)[number];

function navItemsForAccess(): readonly NavItemConfig[] {
  const state = getAuthenticatedState();
  // Pending-access users only get the Account destination until activation.
  if (state && !isAccessActive(state)) {
    return NAV_ITEMS.filter((item) => item.href === '/user');
  }
  return NAV_ITEMS;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname() ?? '/';
  const insets = useSafeAreaInsets();
  const navItems = navItemsForAccess();

  return (
    <View className="flex-1 bg-background md:flex-row">
      <View className="hidden border-r border-border md:flex md:w-64 md:flex-col md:p-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            active={isActive(pathname, item.href)}
            iconSize={20}
            className="mb-1 flex-row items-center gap-3 rounded-lg px-3 py-2.5"
            textClassName="text-[15px]"
          />
        ))}
        <View className="mt-auto border-t border-border pt-4">
          <LanguageToggle className="self-start" />
          <UserMenu className="mt-3" />
        </View>
      </View>
      <View className="flex-1">
        <View
          className="flex-row items-center justify-between gap-3 border-b border-border bg-card px-4 pb-3 md:hidden"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Text
            className="flex-1 text-[17px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {t(screenTitleKey(pathname))}
          </Text>
          <LanguageToggle />
        </View>
        <View className="flex-1 md:mx-auto md:w-full md:max-w-3xl">
          {children}
        </View>
        <View
          className="flex-row border-t border-border bg-card md:hidden"
          style={{ paddingBottom: insets.bottom }}
        >
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              iconSize={22}
              className="flex-1 items-center gap-0.5 py-2"
              textClassName="text-[11px]"
            />
          ))}
        </View>
      </View>
    </View>
  );
}
