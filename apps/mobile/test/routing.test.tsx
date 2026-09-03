import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Index from '../app/index';
import Login from '../app/login';
import CreateRecipe from '../app/create-recipe/index';
import { apiClient } from '../src/api/client';
import { router } from './expo-router-mock';
import {
  clearAuthenticatedState,
  setAuthenticatedState,
} from '../src/auth/session';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/api/client', () => ({
  ApiError: class ApiError extends Error {
    code: string | undefined;
  },
  apiClient: { listRecipes: vi.fn(), extractRecipe: vi.fn() },
}));

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
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
  listRecipesMock.mockResolvedValue([]);
});

describe('mobile shell routing', () => {
  it('redirects logged-out visits to the login route instead of a landing page', () => {
    renderRootScreen();

    expect(router.replace).toHaveBeenCalledWith('/login');
    // No landing buttons remain.
    expect(
      screen.queryByText('Nie masz konta? Zarejestruj się.'),
    ).not.toBeInTheDocument();
  });

  it('navigates from the login screen to the register route', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByText('Nie masz jeszcze konta? Zarejestruj się.'));

    expect(router.push).toHaveBeenCalledWith('/register');
  });

  it('does not duplicate the account zone inside the collection screen body', async () => {
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

    expect(screen.getByText('Twoja kolekcja')).toBeInTheDocument();
    // The email lives only in the sidebar user control, not in the screen body.
    expect(screen.getAllByText('user@example.com')).toHaveLength(1);
    // Sign-out is not offered in the collection screen body.
    expect(screen.queryByText('Wyloguj się')).not.toBeInTheDocument();
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
    // The action appears on the empty-collection screen and in the shell nav.
    expect(screen.getAllByText('Dodaj przepis').length).toBeGreaterThan(0);
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

    expect(router.replace).toHaveBeenCalledWith('/user');
    expect(screen.queryByText('Twoja kolekcja')).not.toBeInTheDocument();
    expect(screen.queryByText('Jesteś zalogowany')).not.toBeInTheDocument();
  });

  it('redirects pending-access users from the create-recipe route to the account route', async () => {
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
    render(<CreateRecipe />);

    expect(router.replace).toHaveBeenCalledWith('/user');
    expect(screen.queryByText('Nowy przepis')).not.toBeInTheDocument();
  });
});
