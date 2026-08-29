import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RecipeDetailsResponse } from '@dinner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecipeDetails from '../app/recipes/[id]';
import { ApiError, apiClient } from '../src/api/client';
import { router, setLocalParams } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
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
    deleteRecipe: vi.fn(),
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
    preparationSteps: [
      {
        id: '7d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
        text: 'Pokrój',
        position: 0,
      },
    ],
  };
}

function renderDetailsScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RecipeDetails />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  setLocalParams({ id: recipeId });
  vi.mocked(apiClient.getRecipe).mockReset();
  vi.mocked(apiClient.deleteRecipe).mockReset();
  vi.mocked(apiClient.getRecipe).mockResolvedValue(recipeDetails());
  vi.mocked(apiClient.deleteRecipe).mockResolvedValue(undefined);
  router.back.mockClear();
});

describe('RecipeDetails screen', () => {
  it('shows the complete saved recipe', async () => {
    renderDetailsScreen();

    expect(await screen.findByText('Zupa')).toBeInTheDocument();
    expect(screen.getByText('Domowa')).toBeInTheDocument();
    expect(screen.getByText('4 porcje')).toBeInTheDocument();
    expect(screen.getByText(/Pomidor/)).toBeInTheDocument();
    expect(screen.getByText('Pokrój')).toBeInTheDocument();
  });

  it('asks for confirmation and deletes the recipe on success', async () => {
    const user = userEvent.setup();
    renderDetailsScreen();

    await user.click(await screen.findByText('Usuń przepis'));

    expect(screen.getByText('Usunąć przepis?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Przepis zostanie trwale usunięty wraz ze składnikami i krokami.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByText('Usuń'));

    await waitFor(() =>
      expect(apiClient.deleteRecipe).toHaveBeenCalledWith(recipeId),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('does not delete when the user cancels the confirmation', async () => {
    const user = userEvent.setup();
    renderDetailsScreen();

    await user.click(await screen.findByText('Usuń przepis'));
    expect(screen.getByText('Usunąć przepis?')).toBeInTheDocument();

    await user.click(screen.getByText('Anuluj'));

    expect(apiClient.deleteRecipe).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(screen.queryByText('Usunąć przepis?')).not.toBeInTheDocument();
    expect(screen.getByText('Usuń przepis')).toBeInTheDocument();
  });

  it('shows a safe message when deletion fails', async () => {
    vi.mocked(apiClient.deleteRecipe).mockRejectedValue(
      new ApiError('Wystąpił błąd.', 500),
    );
    const user = userEvent.setup();
    renderDetailsScreen();

    await user.click(await screen.findByText('Usuń przepis'));
    await user.click(screen.getByText('Usuń'));

    expect(
      await screen.findByText(/Nie udało się usunąć przepisu/),
    ).toBeInTheDocument();
  });

  it('shows a safe message when the recipe is not found', async () => {
    vi.mocked(apiClient.getRecipe).mockRejectedValue(
      new ApiError('Nie znaleziono przepisu.', 404, 'RECIPE_NOT_FOUND'),
    );
    renderDetailsScreen();

    expect(
      await screen.findByText('Nie znaleziono przepisu.'),
    ).toBeInTheDocument();
  });
});
