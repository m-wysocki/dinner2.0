import { Pressable } from 'react-native';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface RecipeTileProps {
  title: string;
  servingsLabel: string;
  description?: string | null;
  onPress: () => void;
  className?: string;
}

export function RecipeTile({
  title,
  servingsLabel,
  description,
  onPress,
  className,
}: RecipeTileProps) {
  return (
    <Pressable
      className={cn(
        'flex-1 flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/5',
        'active:scale-[0.99] active:opacity-80 hover:border-brand/50 hover:shadow-md',
        className,
      )}
      onPress={onPress}
    >
      <CardTitle className="text-lg leading-snug" numberOfLines={2}>
        {title}
      </CardTitle>
      {description ? (
        <Text
          className="text-sm leading-snug text-muted-foreground"
          numberOfLines={2}
        >
          {description}
        </Text>
      ) : null}
      <CardDescription className="mt-auto pt-1">
        {servingsLabel}
      </CardDescription>
    </Pressable>
  );
}
