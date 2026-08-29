import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExtractRecipeDraft } from '@dinner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateRecipe from '../app/create-recipe/index';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/session', () => ({ getAuthenticatedState: vi.fn() }));
vi.mock('../src/api/client', () => ({
  ApiError: class ApiError extends Error {
    status = 0;
    code: string | undefined;
    constructor(message: string, status = 0, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  apiClient: {
    extractRecipe: vi.fn(),
  },
}));

import { ApiError, apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';
import { router } from './expo-router-mock';

function draft(): ExtractRecipeDraft {
  return {
    title: 'Zupa pomidorowa',
    description: 'Kremowa zupa pomidorowa.',
    servingCount: 4,
    ingredients: [
      {
        name: 'Pomidor',
        catalogEntryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        customProposal: null,
        quantity: '2',
        unit: 'PCS',
        note: null,
        position: 0,
      },
    ],
    preparationSteps: [{ text: 'Gotuj pomidory', position: 0 }],
  };
}

beforeEach(() => {
  vi.mocked(getAuthenticatedState).mockReturnValue({
    session: {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: 9999999999,
    },
    user: {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      emailConfirmedAt: '2026-08-27T12:00:00.000Z',
      accessStatus: 'ACTIVE',
      interfaceLanguage: 'pl',
    },
  });
  vi.mocked(apiClient.extractRecipe).mockReset();
  vi.mocked(apiClient.extractRecipe).mockResolvedValue(draft());
  router.push.mockClear();
});

describe('CreateRecipe screen', () => {
  it('sends title, source text, and serving count to extraction and opens the review step', async () => {
    const user = userEvent.setup();
    render(<CreateRecipe />);
    await user.type(screen.getByPlaceholderText('Np. Zupa pomidorowa'), 'Zupa');
    await user.type(
      screen.getByLabelText('Treść przepisu'),
      'Składniki: 2 pomidory. Gotuj.',
    );
    await user.type(screen.getByLabelText('Liczba porcji'), '4');
    await user.click(screen.getByText('Wyodrębnij przepis'));

    await waitFor(() =>
      expect(apiClient.extractRecipe).toHaveBeenCalledWith({
        title: 'Zupa',
        sourceText: 'Składniki: 2 pomidory. Gotuj.',
        servingCount: 4,
      }),
    );
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/create-recipe/review'),
    );
  });

  it('requires the title, source text, and serving count before extracting', async () => {
    const user = userEvent.setup();
    render(<CreateRecipe />);
    await user.click(screen.getByText('Wyodrębnij przepis'));

    expect(
      await screen.findByText('Podaj tytuł, treść przepisu i liczbę porcji.'),
    ).toBeInTheDocument();
    expect(apiClient.extractRecipe).not.toHaveBeenCalled();
  });

  it('shows a loud localized error on failure and keeps the input for a retry', async () => {
    vi.mocked(apiClient.extractRecipe).mockRejectedValue(
      new ApiError('Nie udało się wyodrębnić przepisu. Spróbuj ponownie.', 502),
    );
    const user = userEvent.setup();
    render(<CreateRecipe />);
    await user.type(screen.getByPlaceholderText('Np. Zupa pomidorowa'), 'Zupa');
    await user.type(
      screen.getByLabelText('Treść przepisu'),
      'Składniki: pomidor.',
    );
    await user.type(screen.getByLabelText('Liczba porcji'), '4');
    await user.click(screen.getByText('Wyodrębnij przepis'));

    expect(
      await screen.findByText(
        'Nie udało się wyodrębnić przepisu. Spróbuj ponownie.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument();
    expect(
      (screen.getByPlaceholderText('Np. Zupa pomidorowa') as HTMLInputElement)
        .value,
    ).toBe('Zupa');

    vi.mocked(apiClient.extractRecipe).mockResolvedValue(draft());
    await user.click(screen.getByText('Spróbuj ponownie'));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/create-recipe/review'),
    );
  });
});
