import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Index from '../app/index';
import Register from '../app/register';
import { apiClient } from '../src/api/client';
import { router } from './expo-router-mock';
import {
  clearAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/api/client', () => ({
  apiClient: { health: vi.fn(), listRecipes: vi.fn() },
}));

const healthMock = vi.mocked(apiClient.health);
const listRecipesMock = vi.mocked(apiClient.listRecipes);

function renderRootScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <Index />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  clearAuthenticatedState();
  healthMock.mockReset();
  router.push.mockClear();
  router.back.mockClear();
  healthMock.mockResolvedValue({ status: 'ok', service: 'api' });
  listRecipesMock.mockResolvedValue([]);
});

describe('mobile shell routing', () => {
  it('navigates from the root screen to the register route', async () => {
    const user = userEvent.setup();
    renderRootScreen();

    await user.click(screen.getByText('Nie masz konta? Zarejestruj się.'));

    expect(router.push).toHaveBeenCalledWith('/register');
  });

  it('navigates from the root screen to the login route', async () => {
    const user = userEvent.setup();
    renderRootScreen();

    await user.click(screen.getByText('Zaloguj się'));

    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('navigates back from the register screen to the root', async () => {
    const user = userEvent.setup();
    render(<Register />);

    await user.click(screen.getByText('Wróć'));

    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('shows the authenticated state and logout action on the root screen', async () => {
    await setAuthenticatedState({
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
        interfaceLanguage: 'pl',
      },
    });
    const user = userEvent.setup();
    renderRootScreen();

    expect(screen.getByText('Twoja kolekcja')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();

    await user.click(screen.getByText('Wyloguj się'));

    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('shows an empty collection with an action to create a recipe', async () => {
    await setAuthenticatedState({
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
        interfaceLanguage: 'pl',
      },
    });
    renderRootScreen();

    expect(
      await screen.findByText('Nie masz jeszcze przepisów'),
    ).toBeInTheDocument();
    expect(screen.getByText('Dodaj przepis')).toBeInTheDocument();
    expect(listRecipesMock).toHaveBeenCalled();
  });

  it('does not enter the protected shell while access is pending', async () => {
    await setAuthenticatedState({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
      user: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'pending@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      },
    });
    renderRootScreen();

    expect(
      screen.getByText('Dostęp oczekuje na aktywację'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Jesteś zalogowany')).not.toBeInTheDocument();
  });
});
