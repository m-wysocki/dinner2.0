import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
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

async function renderDetailsScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await render(
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
    await renderDetailsScreen();

    expect(await screen.findByText('Zupa')).toBeOnTheScreen();
    expect(screen.getByText('Domowa')).toBeOnTheScreen();
    expect(screen.getByText('4 porcje')).toBeOnTheScreen();
    expect(screen.getByText(/Pomidor/)).toBeOnTheScreen();
    expect(screen.getByText('Pokrój')).toBeOnTheScreen();
  });

  it('asks for confirmation and deletes the recipe on success', async () => {
    const user = userEvent.setup();
    await renderDetailsScreen();

    await user.press(await screen.findByText('Usuń przepis'));

    expect(screen.getByText('Usunąć przepis?')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Przepis zostanie trwale usunięty wraz ze składnikami i krokami.',
      ),
    ).toBeOnTheScreen();

    await user.press(screen.getByText('Usuń'));

    await waitFor(() =>
      expect(apiClient.deleteRecipe).toHaveBeenCalledWith(recipeId),
    );
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('does not delete when the user cancels the confirmation', async () => {
    const user = userEvent.setup();
    await renderDetailsScreen();

    await user.press(await screen.findByText('Usuń przepis'));
    expect(screen.getByText('Usunąć przepis?')).toBeOnTheScreen();

    await user.press(screen.getByText('Anuluj'));

    expect(apiClient.deleteRecipe).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(screen.queryByText('Usunąć przepis?')).not.toBeOnTheScreen();
    expect(screen.getByText('Usuń przepis')).toBeOnTheScreen();
  });

  it('shows a safe message when deletion fails', async () => {
    vi.mocked(apiClient.deleteRecipe).mockRejectedValue(
      new ApiError('Wystąpił błąd.', 500),
    );
    const user = userEvent.setup();
    await renderDetailsScreen();

    await user.press(await screen.findByText('Usuń przepis'));
    await user.press(screen.getByText('Usuń'));

    expect(
      await screen.findByText(/Nie udało się usunąć przepisu/),
    ).toBeOnTheScreen();
  });

  it('shows a safe message when the recipe is not found', async () => {
    vi.mocked(apiClient.getRecipe).mockRejectedValue(
      new ApiError('Nie znaleziono przepisu.', 404, 'RECIPE_NOT_FOUND'),
    );
    await renderDetailsScreen();

    expect(
      await screen.findByText('Nie znaleziono przepisu.'),
    ).toBeOnTheScreen();
  });
});
