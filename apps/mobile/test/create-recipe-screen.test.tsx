import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateRecipe from '../app/create-recipe';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/session', () => ({ getAuthenticatedState: vi.fn() }));
vi.mock('../src/api/client', () => ({
  apiClient: {
    createRecipe: vi.fn(),
    ingredientCatalog: vi.fn(),
    createCustomIngredient: vi.fn(),
  },
}));

import { apiClient } from '../src/api/client';
import { getAuthenticatedState } from '../src/auth/session';

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
  vi.mocked(apiClient.createRecipe).mockResolvedValue({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Zupa',
    description: null,
    servingCount: 4,
    ingredients: [],
    preparationSteps: [],
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
  });
  vi.mocked(apiClient.ingredientCatalog).mockResolvedValue([
    {
      id: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
      slug: 'tomato',
      namePl: 'Pomidor',
      nameEn: 'Tomato',
      isSystem: true,
    },
  ]);
  vi.mocked(apiClient.createCustomIngredient).mockResolvedValue({
    id: '7d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
    slug: 'custom-owner',
    namePl: 'Kurczak',
    nameEn: 'Kurczak',
    isSystem: false,
  });
});

describe('CreateRecipe screen', () => {
  it('validates and submits the basic recipe fields', async () => {
    const user = userEvent.setup();
    await render(<CreateRecipe />);
    await user.type(screen.getByPlaceholderText('Np. Zupa pomidorowa'), 'Zupa');
    await user.type(
      screen.getByPlaceholderText('Kilka słów o przepisie'),
      'Domowa',
    );
    await user.type(screen.getByPlaceholderText('Np. 4'), '4');
    await user.press(screen.getByText('Zapisz przepis'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith({
        title: 'Zupa',
        description: 'Domowa',
        servingCount: 4,
      }),
    );
    expect(await screen.findByText('Przepis zapisany')).toBeOnTheScreen();
    expect(screen.getByText('Zupa')).toBeOnTheScreen();
  });

  it('submits ingredients and preparation steps with their positions', async () => {
    const user = userEvent.setup();
    await render(<CreateRecipe />);
    await user.type(screen.getByPlaceholderText('Np. Zupa pomidorowa'), 'Zupa');
    await user.type(screen.getByPlaceholderText('Np. 4'), '4');
    await user.press(screen.getByText('Dodaj składnik'));
    await user.type(
      screen.getByLabelText('Nazwa składnika 1'),
      'Pomidor',
    );
    await user.type(screen.getByLabelText('Ilość składnika 1'), '2');
    await user.press(screen.getByText('Pomidor'));
    await user.press(screen.getByText('Dodaj krok'));
    await user.type(
      screen.getByLabelText('Krok przygotowania 1'),
      'Pokrój warzywa',
    );
    await user.press(screen.getByText('Zapisz przepis'));

    await waitFor(() =>
      expect(apiClient.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Zupa',
          servingCount: 4,
          ingredients: [
            {
              name: 'Pomidor',
              quantity: '2',
              unit: 'PCS',
              note: undefined,
              catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
              position: 0,
            },
          ],
          preparationSteps: [{ text: 'Pokrój warzywa', position: 0 }],
        }),
      ),
    );
  });
});
