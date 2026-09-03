import { Link, usePathname, type Href } from 'expo-router';
import { BookOpen, Plus, UserRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
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

function isActive(pathname: string, href: Href) {
  return pathname === href || pathname.startsWith(`${href}/`);
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

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname() ?? '/';
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background md:flex-row">
      <View className="hidden border-r border-border md:flex md:w-64 md:flex-col md:p-4">
        {NAV_ITEMS.map((item) => (
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
      </View>
      <View className="flex-1">
        <View className="flex-1 md:mx-auto md:w-full md:max-w-3xl">
          {children}
        </View>
        <View
          className="flex-row border-t border-border bg-card md:hidden"
          style={{ paddingBottom: insets.bottom }}
        >
          {NAV_ITEMS.map((item) => (
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
