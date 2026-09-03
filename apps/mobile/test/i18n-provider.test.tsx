import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '../src/i18n/i18n';
import { readStoredLanguagePreference } from '../src/i18n/language-preference';
import {
  clearAuthenticatedState,
  setAuthenticatedState,
  type AuthenticatedState,
} from '../src/auth/session';

const LANGUAGE_KEY = 'dinner.interface-language';

const authenticatedState = (interfaceLanguage: 'pl' | 'en'): AuthenticatedState => ({
  session: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  },
  user: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'user@example.com',
    emailConfirmedAt: '2026-08-27T12:00:00.000Z',
    accessStatus: 'ACTIVE',
    interfaceLanguage,
  },
});

function LanguageProbe() {
  const { language, setLanguage } = useI18n();

  return (
    <div>
      <span>language: {language}</span>
      <button onClick={() => setLanguage('en')}>switch to en</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <I18nProvider>
      <LanguageProbe />
    </I18nProvider>,
  );
}

beforeEach(async () => {
  localStorage.clear();
  clearAuthenticatedState();
  // Re-sync the module-level cache with the (now empty) storage, as a fresh
  // app start would.
  await readStoredLanguagePreference();
});

describe('I18nProvider language resolution', () => {
  it('defaults to Polish for a logged-out user without a local choice', async () => {
    renderProvider();

    expect(await screen.findByText('language: pl')).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBeNull();
  });

  it('persists a logged-out local choice across app restarts', async () => {
    const first = renderProvider();
    const user = userEvent.setup();

    await user.click(screen.getByText('switch to en'));
    expect(await screen.findByText('language: en')).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    first.unmount();

    // Simulate a fresh app start: the preference is read back from storage
    // before the first render.
    await readStoredLanguagePreference();

    // A fresh provider instance starts with the stored choice.
    renderProvider();
    expect(screen.getByText('language: en')).toBeInTheDocument();
  });

  it('lets the account language win on login and overwrite the local choice', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'en');
    renderProvider();
    expect(await screen.findByText('language: en')).toBeInTheDocument();

    await act(async () => {
      await setAuthenticatedState(authenticatedState('pl'));
    });

    expect(screen.getByText('language: pl')).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('pl');

    await act(async () => {
      clearAuthenticatedState();
    });

    // After logout the (overwritten) local choice applies.
    expect(screen.getByText('language: pl')).toBeInTheDocument();
  });
});
