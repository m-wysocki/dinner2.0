import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Index from '../app/index';
import Register from '../app/register';
import { apiClient } from '../src/api/client';
import { router } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/api/client', () => ({ apiClient: { health: vi.fn() } }));

const healthMock = vi.mocked(apiClient.health);

async function renderRootScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <Index />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  healthMock.mockReset();
  router.push.mockClear();
  router.back.mockClear();
  healthMock.mockResolvedValue({ status: 'ok', service: 'api' });
});

describe('mobile shell routing', () => {
  it('navigates from the root screen to the register route', async () => {
    const user = userEvent.setup();
    await renderRootScreen();

    await user.press(screen.getByText('Nie masz konta? Zarejestruj się.'));

    expect(router.push).toHaveBeenCalledWith('/register');
  });

  it('navigates from the root screen to the login route', async () => {
    const user = userEvent.setup();
    await renderRootScreen();

    await user.press(screen.getByText('Zaloguj się'));

    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('navigates back from the register screen to the root', async () => {
    const user = userEvent.setup();
    await render(<Register />);

    await user.press(screen.getByText('Wróć'));

    expect(router.push).toHaveBeenCalledWith('/');
  });
});
