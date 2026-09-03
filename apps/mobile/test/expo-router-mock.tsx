import { Children, cloneElement, createElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
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

let currentPathname = '/';

export function usePathname() {
  return currentPathname;
}

export function setPathname(pathname: string) {
  currentPathname = pathname;
}

export function Redirect({ href }: { href: string }) {
  router.replace(href);
  return null;
}

type RouterLinkProps = {
  href: string;
  onPress?: () => void;
  asChild?: boolean;
  children?: ReactNode;
} & Record<string, unknown>;

export function Link({
  href,
  onPress,
  asChild,
  children,
  ...rest
}: RouterLinkProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(href);
    }
  };

  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      const childElement = child as ReactElement<Record<string, unknown>>;
      const childOnPress = childElement.props.onPress as
        (() => void) | undefined;
      return cloneElement(childElement, {
        onPress: () => {
          childOnPress?.();
          handlePress();
        },
      });
    }
  }

  return createElement(Pressable, { ...rest, onPress: handlePress }, children);
}

export function Stack({ children }: { children?: ReactNode }) {
  return createElement(View, null, children);
}

export const Tabs = Stack;
