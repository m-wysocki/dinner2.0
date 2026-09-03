import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Language from '../app/language';
import { translate } from '../src/i18n/translations';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/session', () => ({
  getAuthenticatedState: vi.fn(),
  setAuthenticatedState: vi.fn(),
}));
vi.mock('../src/api/client', () => ({
  apiClient: { updateUser: vi.fn() },
}));
vi.mock('../src/i18n/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/i18n/i18n')>();
  return { ...actual, useI18n: vi.fn() };
});

import { apiClient } from '../src/api/client';
import {
  getAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';
import { useI18n } from '../src/i18n/i18n';

const activeUser = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: 'user@example.com',
  emailConfirmedAt: '2026-08-27T12:00:00.000Z',
  accessStatus: 'ACTIVE' as const,
  interfaceLanguage: 'pl' as const,
};

const setLanguageMock = vi.fn();

function mockI18n(language: 'pl' | 'en') {
  vi.mocked(useI18n).mockReturnValue({
    language,
    setLanguage: setLanguageMock,
    t: (key, params) => translate(key, params, language),
  });
}

beforeEach(() => {
  vi.mocked(getAuthenticatedState).mockReturnValue({
    session: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 9999999999,
    },
    user: activeUser,
  });
  vi.mocked(setAuthenticatedState).mockClear().mockResolvedValue(undefined);
  vi.mocked(apiClient.updateUser).mockClear().mockResolvedValue({
    ...activeUser,
    interfaceLanguage: 'en',
  });
  setLanguageMock.mockReset();
});

describe('Language screen', () => {
  it('highlights the current interface language', () => {
    mockI18n('pl');
    render(<Language />);

    expect(screen.getByText('Język interfejsu')).toBeInTheDocument();
    expect(screen.getByText('Polski')).toBeInTheDocument();
    expect(screen.getByText('Angielski')).toBeInTheDocument();
    expect(screen.getAllByText('Obecny')).toHaveLength(1);
  });

  it('switches to English and persists the preference', async () => {
    mockI18n('pl');
    const user = userEvent.setup();
    render(<Language />);

    await user.click(screen.getByText('Angielski'));

    expect(apiClient.updateUser).toHaveBeenCalledWith({
      interfaceLanguage: 'en',
    });
    expect(setAuthenticatedState).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ interfaceLanguage: 'en' }),
      }),
    );
    expect(setLanguageMock).toHaveBeenCalledWith('en');
  });

  it('reverts the optimistic change and shows the error when saving fails', async () => {
    mockI18n('pl');
    vi.mocked(apiClient.updateUser).mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<Language />);

    await user.click(screen.getByText('Angielski'));

    expect(setLanguageMock).toHaveBeenNthCalledWith(1, 'en');
    expect(setLanguageMock).toHaveBeenNthCalledWith(2, 'pl');
    expect(await screen.findByText('offline')).toBeInTheDocument();
  });

  it('switches locally without an account when logged out', async () => {
    mockI18n('pl');
    vi.mocked(getAuthenticatedState).mockReturnValue(null);
    const user = userEvent.setup();
    render(<Language />);

    expect(screen.getByText('Język interfejsu')).toBeInTheDocument();

    await user.click(screen.getByText('Angielski'));

    expect(setLanguageMock).toHaveBeenCalledWith('en');
    expect(apiClient.updateUser).not.toHaveBeenCalled();
    expect(setAuthenticatedState).not.toHaveBeenCalled();
  });
});
