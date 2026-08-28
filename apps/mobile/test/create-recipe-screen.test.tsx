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
vi.mock('../src/api/client', () => ({ apiClient: { createRecipe: vi.fn() } }));

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
    createdAt: '2026-08-28T12:00:00.000Z',
    updatedAt: '2026-08-28T12:00:00.000Z',
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
  });
});
