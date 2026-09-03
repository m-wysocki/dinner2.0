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
  getLocalLanguagePreference,
  readStoredLanguagePreference,
  resolveInterfaceLanguage,
  writeStoredLanguagePreference,
} from './language-preference';
import {
  translate as translateForLanguage,
  type TranslationKey,
  type TranslationParams,
} from './translations';

export { formatServings, unitLabel } from './translations';
export type { TranslationKey, TranslationParams } from './translations';

function authenticatedLanguage(): InterfaceLanguage | null {
  return getAuthenticatedState()?.user.interfaceLanguage ?? null;
}

function resolveCurrentLanguage(): InterfaceLanguage {
  return resolveInterfaceLanguage(
    authenticatedLanguage(),
    getLocalLanguagePreference(),
  );
}

export function translate(
  key: TranslationKey,
  params?: TranslationParams,
): string {
  return translateForLanguage(key, params, resolveCurrentLanguage());
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
    resolveCurrentLanguage(),
  );

  useEffect(() => {
    let cancelled = false;

    void readStoredLanguagePreference().then((stored) => {
      if (!cancelled) {
        setLanguage(resolveInterfaceLanguage(authenticatedLanguage(), stored));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      subscribeToSession(() => {
        const authenticated = authenticatedLanguage();

        if (authenticated) {
          // The account language wins over the local choice on login.
          void writeStoredLanguagePreference(authenticated);
        }

        setLanguage(resolveCurrentLanguage());
      }),
    [],
  );

  const value = useMemo<I18nValue>(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguage(next);

        if (!getAuthenticatedState()) {
          // Logged-out users store their choice on the device only.
          void writeStoredLanguagePreference(next);
        }
      },
      t: (key, params) => translateForLanguage(key, params, language),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
