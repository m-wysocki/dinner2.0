import { createElement } from 'react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { vi } from 'vitest';

export const router = {
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
};

export function useRouter() {
  return router;
}

const localParams: Record<string, string | string[]> = {};

export function useLocalSearchParams<
  TParsedQuery = Record<string, string | string[]>,
>() {
  return localParams as TParsedQuery;
}

export function setLocalParams(params: Record<string, string | string[]>) {
  Object.assign(localParams, params);
}

export function useSegments() {
  return [];
}

export function Redirect({ href }: { href: string }) {
  return null;
}

type RouterLinkProps = {
  href: string;
  onPress?: () => void;
  children?: ReactNode;
} & Record<string, unknown>;

export function Link({ href, onPress, children, ...rest }: RouterLinkProps) {
  return createElement(
    Pressable,
    {
      ...rest,
      onPress: () => {
        if (onPress) {
          onPress();
        } else {
          router.push(href);
        }
      },
    },
    children,
  );
}

export function Stack({ children }: { children?: ReactNode }) {
  return createElement(View, null, children);
}

export const Tabs = Stack;
