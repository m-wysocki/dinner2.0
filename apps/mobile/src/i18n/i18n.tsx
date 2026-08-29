import type { InterfaceLanguage } from '@dinner/shared';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAuthenticatedState, subscribeToSession } from '../auth/session';
import {
  translate as translateForLanguage,
  type TranslationKey,
  type TranslationParams,
} from './translations';

export { formatServings, unitLabel } from './translations';
export type { TranslationKey, TranslationParams } from './translations';

function sessionLanguage(): InterfaceLanguage {
  return getAuthenticatedState()?.user.interfaceLanguage ?? 'pl';
}

export function translate(
  key: TranslationKey,
  params?: TranslationParams,
): string {
  return translateForLanguage(key, params, sessionLanguage());
}

export interface I18nValue {
  language: InterfaceLanguage;
  setLanguage: (language: InterfaceLanguage) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const defaultI18n: I18nValue = {
  language: 'pl',
  setLanguage: () => undefined,
  t: (key, params) => translateForLanguage(key, params, 'pl'),
};

const I18nContext = createContext<I18nValue>(defaultI18n);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<InterfaceLanguage>(() =>
    sessionLanguage(),
  );

  useEffect(
    () =>
      subscribeToSession(() => {
        setLanguage(sessionLanguage());
      }),
    [],
  );

  const value = useMemo<I18nValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => translateForLanguage(key, params, language),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
