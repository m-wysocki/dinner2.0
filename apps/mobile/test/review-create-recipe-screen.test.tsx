import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExtractRecipeDraft } from '@dinner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateReview from '../app/create-recipe/review';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/session', () => ({
  getAuthenticatedState: vi.fn(),
  subscribeToSession: vi.fn(() => () => undefined),
}));
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
    createRecipe: vi.fn(),
    ingredientCatalog: vi.fn(),
    createCustomIngredient: vi.fn(),
  },
}));
vi.mock('../src/recipe/create-draft', () => ({
  getCreateDraft: vi.fn(),
  clearCreateDraft: vi.fn(),
}));
vi.mock('../src/i18n/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/i18n/i18n')>();
  return { ...actual, useI18n: vi.fn() };
});

import { apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';
import { clearCreateDraft, getCreateDraft } from '../src/recipe/create-draft';
import { router } from './expo-router-mock';
import { mockI18n } from './i18n-mock';

const MATCHED_ENTRY_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const TOMATO_ENTRY_ID = '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a';
const SAFFRON_ENTRY_ID = '7d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a';

function draft(): ExtractRecipeDraft {
  return {
    title: 'Zupa pomidorowa',
    description: 'Kremowa zupa pomidorowa.',
    servingCount: 4,
    ingredients: [
      {
        name: 'Pomidor',
        catalogEntryId: MATCHED_ENTRY_ID,
        customProposal: null,
        quantity: '2',
        unit: 'PCS',
        note: null,
        position: 0,
      },
    ],
  };
}

function draftWithProposal(): ExtractRecipeDraft {
  return {
    title: 'Zupa',
    description: 'Zupa z szafranem.',
    servingCount: 4,
    ingredients: [
      {
        name: 'Szafran',
        catalogEntryId: null,
        customProposal: { namePl: 'Szafran', nameEn: 'Szafran' },
        quantity: null,
        unit: 'OTHER',
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
  vi.mocked(getCreateDraft).mockReturnValue({
    draft: draft(),
    sourceText: 'Składniki: 2 pomidory. Gotuj.',
  });
  vi.mocked(apiClient.ingredientCatalog).mockReset();
  vi.mocked(apiClient.ingredientCatalog).mockResolvedValue([
    {
      id: TOMATO_ENTRY_ID,
      slug: 'tomato',
      namePl: 'Pomidor',
      nameEn: 'Tomato',
      isSystem: true,
    },
  ]);
  vi.mocked(apiClient.createCustomIngredient).mockReset();
  vi.mocked(apiClient.createCustomIngredient).mockResolvedValue({
    id: SAFFRON_ENTRY_ID,
    slug: 'custom-owner',
    namePl: 'Szafran',
    nameEn: 'Szafran',
    isSystem: false,
  });
  vi.mocked(apiClient.createRecipe).mockReset();
  vi.mocked(apiClient.createRecipe).mockResolvedValue({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Zupa pomidorowa',
    description: 'Kremowa zupa pomidorowa.',
    servingCount: 4,
    ingredients: [],
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
  });
  vi.mocked(clearCreateDraft).mockClear();
  router.back.mockClear();
  mockI18n('pl');
});

describe('CreateReview screen', () => {
  it('shows the original pasted recipe and lets the user correct the draft', async () => {
    const user = userEvent.setup();
    render(<CreateReview />);

    expect(screen.getByText('Przejrzyj przepis')).toBeInTheDocument();
    expect(screen.getByText('Oryginalny przepis')).toBeInTheDocument();
    expect(
      screen.getByText('Składniki: 2 pomidory. Gotuj.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa składnika 1')).toHaveValue('Pomidor');

    await user.click(screen.getByText('Zapisz przepis'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith({
        title: 'Zupa pomidorowa',
        description: 'Kremowa zupa pomidorowa.',
        servingCount: 4,
        ingredients: [
          {
            catalogEntryId: MATCHED_ENTRY_ID,
            name: 'Pomidor',
            quantity: '2',
            unit: 'PCS',
            note: undefined,
            position: 0,
          },
        ],
        sourceText: 'Składniki: 2 pomidory. Gotuj.',
      }),
    );
    expect(clearCreateDraft).toHaveBeenCalled();
    expect(await screen.findByText('Przepis zapisany')).toBeInTheDocument();
    expect(screen.getByText('Zupa pomidorowa')).toBeInTheDocument();
  });

  it('accepts a proposed custom identity and saves with the created entry', async () => {
    vi.mocked(getCreateDraft).mockReturnValue({
      draft: draftWithProposal(),
      sourceText: 'Składniki: szafran.',
    });
    const user = userEvent.setup();
    render(<CreateReview />);

    expect(screen.getByText(/Nieznany składnik „Szafran”/)).toBeInTheDocument();
    expect(screen.getByText('Nowy składnik')).toBeInTheDocument();

    await user.click(screen.getByText('Dodaj jako nowy składnik'));

    await waitFor(() =>
      expect(apiClient.createCustomIngredient).toHaveBeenCalledWith({
        name: 'Szafran',
      }),
    );
    expect(
      screen.queryByText(/Nieznany składnik „Szafran”/),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText('Zapisz przepis'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [
            expect.objectContaining({ catalogEntryId: SAFFRON_ENTRY_ID }),
          ],
        }),
      ),
    );
  });

  it('remaps a proposal to an existing catalog identity before saving', async () => {
    vi.mocked(getCreateDraft).mockReturnValue({
      draft: draftWithProposal(),
      sourceText: 'Składniki: szafran.',
    });
    const user = userEvent.setup();
    render(<CreateReview />);

    await user.click(await screen.findByText('Pomidor'));

    expect(
      screen.queryByText(/Nieznany składnik „Szafran”/),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText('Zapisz przepis'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [
            expect.objectContaining({ catalogEntryId: TOMATO_ENTRY_ID }),
          ],
        }),
      ),
    );
  });

  it('saves a matched ingredient as a new custom identity', async () => {
    const user = userEvent.setup();
    render(<CreateReview />);

    const nameInput = screen.getByLabelText('Nazwa składnika 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Mąka pszenna');

    await user.click(screen.getByText('Dodaj jako nowy składnik'));

    await waitFor(() =>
      expect(apiClient.createCustomIngredient).toHaveBeenCalledWith({
        name: 'Mąka pszenna',
      }),
    );

    await user.click(screen.getByText('Zapisz przepis'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [
            expect.objectContaining({
              name: 'Mąka pszenna',
              catalogEntryId: SAFFRON_ENTRY_ID,
            }),
          ],
        }),
      ),
    );
  });

  it('redirects to the create screen when there is no draft to review', () => {
    vi.mocked(getCreateDraft).mockReturnValue(null);
    render(<CreateReview />);

    expect(screen.queryByText('Przejrzyj przepis')).not.toBeInTheDocument();
  });

  it('localizes the review step and resolves the proposal in English', async () => {
    mockI18n('en');
    vi.mocked(getCreateDraft).mockReturnValue({
      draft: {
        title: 'Soup',
        description: 'Saffron soup.',
        servingCount: 4,
        ingredients: [
          {
            name: 'Saffron',
            catalogEntryId: null,
            customProposal: { namePl: 'Szafran', nameEn: 'Saffron' },
            quantity: null,
            unit: 'OTHER',
            note: null,
            position: 0,
          },
        ],
      },
      sourceText: 'Ingredients: saffron.',
    });
    const user = userEvent.setup();
    render(<CreateReview />);

    expect(screen.getByText('Review the recipe')).toBeInTheDocument();
    expect(screen.getByText('Original recipe')).toBeInTheDocument();
    expect(screen.getByText('New ingredient')).toBeInTheDocument();
    expect(
      screen.getByText(/Unknown ingredient "Saffron"/),
    ).toBeInTheDocument();
    expect(await screen.findByText('Tomato')).toBeInTheDocument();

    await user.click(screen.getByText('Tomato'));

    expect(
      screen.queryByText(/Unknown ingredient "Saffron"/),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText('Save recipe'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [
            expect.objectContaining({ catalogEntryId: TOMATO_ENTRY_ID }),
          ],
        }),
      ),
    );
    expect(await screen.findByText('Recipe saved')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The recipe for 4 servings was added to your collection.',
      ),
    ).toBeInTheDocument();
  });
});
