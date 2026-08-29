import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../app/login';
import { submitLogin } from '../src/auth/login';
import type { LoginFormResult } from '../src/auth/login';
import { router } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/login', () => ({
  submitLogin: vi.fn(),
}));

const submitLoginMock = vi.mocked(submitLogin);

const email = 'user@example.com';
const password = 'correct horse';

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Adres e-mail'), email);
  await user.type(screen.getByPlaceholderText('Hasło'), password);
  await user.click(screen.getByText('Zaloguj się'));
}

beforeEach(() => {
  submitLoginMock.mockReset();
  router.replace.mockClear();
  router.push.mockClear();
});

describe('Login screen', () => {
  it('renders the login form initially', () => {
    render(<Login />);

    expect(screen.getByText('Logowanie')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Adres e-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hasło')).toBeInTheDocument();
    expect(screen.getByText('Zaloguj się')).toBeInTheDocument();
  });

  it('shows a loading state while submitting', async () => {
    let resolveSubmit!: (value: LoginFormResult) => void;
    submitLoginMock.mockReturnValue(
      new Promise<LoginFormResult>((resolve) => {
        resolveSubmit = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<Login />);

    await fillAndSubmit(user);

    expect(submitLoginMock).toHaveBeenCalledWith({ email, password });
    expect(screen.getByPlaceholderText('Adres e-mail')).toHaveAttribute(
      'readonly',
    );
    expect(screen.getByPlaceholderText('Hasło')).toHaveAttribute('readonly');

    resolveSubmit({ kind: 'success' });
    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/user'),
    );
  });

  it('transitions to the authenticated flow after success', async () => {
    submitLoginMock.mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();
    render(<Login />);

    await fillAndSubmit(user);

    expect(router.replace).toHaveBeenCalledWith('/user');
  });

  it('presents the API error message on failure', async () => {
    submitLoginMock.mockResolvedValue({
      kind: 'error',
      message: 'Nieprawidłowy adres e-mail lub hasło.',
    });

    const user = userEvent.setup();
    render(<Login />);

    await fillAndSubmit(user);

    expect(
      await screen.findByText('Nieprawidłowy adres e-mail lub hasło.'),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
