import { beforeEach, describe, expect, it } from 'vitest';
import {
  getLocalLanguagePreference,
  readStoredLanguagePreference,
  resolveInterfaceLanguage,
  writeStoredLanguagePreference,
} from './language-preference';

const LANGUAGE_KEY = 'dinner.interface-language';

describe('resolveInterfaceLanguage', () => {
  it('defaults to Polish for a logged-out user without a local choice', () => {
    expect(resolveInterfaceLanguage(null, null)).toBe('pl');
  });

  it('uses the local choice for a logged-out user', () => {
    expect(resolveInterfaceLanguage(null, 'en')).toBe('en');
    expect(resolveInterfaceLanguage(null, 'pl')).toBe('pl');
  });

  it('prefers the account language over the local choice once logged in', () => {
    expect(resolveInterfaceLanguage('pl', 'en')).toBe('pl');
    expect(resolveInterfaceLanguage('en', 'pl')).toBe('en');
  });
});

describe('local language preference persistence on web', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no preference is stored', async () => {
    await expect(readStoredLanguagePreference()).resolves.toBeNull();
    expect(getLocalLanguagePreference()).toBeNull();
  });

  it('persists the choice to localStorage and reads it back', async () => {
    await writeStoredLanguagePreference('en');

    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    expect(getLocalLanguagePreference()).toBe('en');
    await expect(readStoredLanguagePreference()).resolves.toBe('en');
  });

  it('keeps the in-memory preference readable without a fresh read', async () => {
    await writeStoredLanguagePreference('pl');

    expect(getLocalLanguagePreference()).toBe('pl');
  });

  it('ignores unsupported stored values', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'fr');

    await expect(readStoredLanguagePreference()).resolves.toBeNull();
    expect(getLocalLanguagePreference()).toBeNull();
  });
});
