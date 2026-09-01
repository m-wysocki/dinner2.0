import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExtractRecipeDraft } from '@dinner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateRecipe from '../app/create-recipe/index';
import { translate } from '../src/i18n/translations';

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
vi.mock('../src/i18n/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/i18n/i18n')>();
  return { ...actual, useI18n: vi.fn() };
});

import { ApiError, apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';
import { useI18n } from '../src/i18n/i18n';
import { router } from './expo-router-mock';

function mockI18n(language: 'pl' | 'en') {
  vi.mocked(useI18n).mockReturnValue({
    language,
    setLanguage: vi.fn(),
    t: (key, params) => translate(key, params, language),
  });
}

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
  mockI18n('pl');
  router.push.mockClear();
});

describe('CreateRecipe screen', () => {
  it('sends title, source text, and serving count to extraction and opens the review step', async () => {
    let resolveExtraction!: (value: ExtractRecipeDraft) => void;
    vi.mocked(apiClient.extractRecipe).mockImplementation(
      () =>
        new Promise<ExtractRecipeDraft>(
          (resolve) => (resolveExtraction = resolve),
        ),
    );
    const user = userEvent.setup();
    render(<CreateRecipe />);
    await user.type(screen.getByPlaceholderText('Np. Zupa pomidorowa'), 'Zupa');
    await user.type(
      screen.getByLabelText('Treść przepisu'),
      'Składniki: 2 pomidory. Gotuj.',
    );
    await user.type(screen.getByLabelText('Liczba porcji'), '4');
    await user.click(screen.getByText('Wyodrębnij przepis'));

    expect(
      await screen.findByText('AI przetwarza przepis...'),
    ).toBeInTheDocument();

    resolveExtraction(draft());
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

  it('localizes labels, the AI loading state, and failure/retry in English', async () => {
    mockI18n('en');
    let rejectExtraction!: (reason?: unknown) => void;
    vi.mocked(apiClient.extractRecipe).mockImplementation(
      () =>
        new Promise<ExtractRecipeDraft>(
          (_, reject) => (rejectExtraction = reject),
        ),
    );
    const user = userEvent.setup();
    render(<CreateRecipe />);

    expect(screen.getByText('New recipe')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipe text')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Paste the full recipe with ingredients and preparation steps',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Number of servings')).toBeInTheDocument();
    expect(screen.getByText('Extract recipe')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('e.g. Tomato soup'), 'Soup');
    await user.type(
      screen.getByLabelText('Recipe text'),
      'Ingredients: 2 tomatoes. Cook.',
    );
    await user.type(screen.getByLabelText('Number of servings'), '4');
    await user.click(screen.getByText('Extract recipe'));

    expect(
      await screen.findByText('AI is processing the recipe...'),
    ).toBeInTheDocument();

    rejectExtraction(
      new ApiError('Extraction failed', 502, 'EXTRACTION_FAILED'),
    );

    expect(
      await screen.findByText('Could not extract the recipe. Try again.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();

    vi.mocked(apiClient.extractRecipe).mockResolvedValue(draft());
    await user.click(screen.getByText('Try again'));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/create-recipe/review'),
    );
  });
});
