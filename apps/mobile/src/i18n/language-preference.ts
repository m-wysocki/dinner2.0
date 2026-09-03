import type { InterfaceLanguage } from '@dinner/shared';
import { interfaceLanguageSchema } from '@dinner/shared';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LANGUAGE_KEY = 'dinner.interface-language';

let cachedPreference: InterfaceLanguage | null = null;

export function resolveInterfaceLanguage(
  authenticatedLanguage: InterfaceLanguage | null,
  localPreference: InterfaceLanguage | null,
): InterfaceLanguage {
  return authenticatedLanguage ?? localPreference ?? 'pl';
}

export function getLocalLanguagePreference(): InterfaceLanguage | null {
  return cachedPreference;
}

async function readStoredPreference(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null;
  }

  return SecureStore.getItemAsync(LANGUAGE_KEY);
}

export async function readStoredLanguagePreference(): Promise<InterfaceLanguage | null> {
  try {
    const stored = await readStoredPreference();
    const parsed = interfaceLanguageSchema.safeParse(stored);
    cachedPreference = parsed.success ? parsed.data : null;
    return cachedPreference;
  } catch {
    cachedPreference = null;
    return null;
  }
}

async function writeStoredPreference(language: InterfaceLanguage): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(LANGUAGE_KEY, language);
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}

export async function writeStoredLanguagePreference(
  language: InterfaceLanguage,
): Promise<void> {
  cachedPreference = language;

  try {
    await writeStoredPreference(language);
  } catch {
    // Keep the in-memory preference even when persistence fails.
  }
}
