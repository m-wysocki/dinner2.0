import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RecipeDetailsResponse } from '@dinner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditRecipe from '../app/edit-recipe/[id]';
import { ApiError, apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';
import { router, setLocalParams } from './expo-router-mock';

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
    getRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    ingredientCatalog: vi.fn(),
    createCustomIngredient: vi.fn(),
  },
}));

const recipeId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

function recipeDetails(): RecipeDetailsResponse {
  return {
    id: recipeId,
    title: 'Zupa',
    description: 'Domowa',
    servingCount: 4,
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
    ingredients: [
      {
        id: '5d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
        catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
        name: 'Pomidor',
        quantity: '2',
        unit: 'PCS',
        note: null,
        position: 0,
      },
    ],
  };
}

function renderEditScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <EditRecipe />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  setLocalParams({ id: recipeId });
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
  vi.mocked(apiClient.getRecipe).mockResolvedValue(recipeDetails());
  vi.mocked(apiClient.updateRecipe).mockResolvedValue(recipeDetails());
  vi.mocked(apiClient.ingredientCatalog).mockResolvedValue([
    {
      id: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
      slug: 'tomato',
      namePl: 'Pomidor',
      nameEn: 'Tomato',
      isSystem: true,
    },
  ]);
  router.back.mockClear();
});

describe('EditRecipe screen', () => {
  it('prefills the loaded recipe and saves changes', async () => {
    const user = userEvent.setup();
    renderEditScreen();

    expect(await screen.findByText('Edytuj przepis')).toBeInTheDocument();
    expect(screen.getByLabelText('Tytuł')).toHaveValue('Zupa');
    expect(screen.getByLabelText('Liczba porcji')).toHaveValue('4');

    await user.clear(screen.getByLabelText('Liczba porcji'));
    await user.type(screen.getByLabelText('Liczba porcji'), '6');
    await user.click(screen.getByText('Zapisz zmiany'));

    await waitFor(() =>
      expect(apiClient.updateRecipe).toHaveBeenCalledWith(
        recipeId,
        expect.objectContaining({
          title: 'Zupa',
          servingCount: 6,
          ingredients: expect.arrayContaining([
            expect.objectContaining({
              name: 'Pomidor',
              quantity: '2',
              position: 0,
            }),
          ]),
        }),
      ),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('shows a safe message when the recipe is not found', async () => {
    vi.mocked(apiClient.getRecipe).mockRejectedValue(
      new ApiError('Nie znaleziono przepisu.', 404, 'RECIPE_NOT_FOUND'),
    );
    renderEditScreen();

    expect(
      await screen.findByText('Nie znaleziono przepisu.'),
    ).toBeInTheDocument();
  });
});
