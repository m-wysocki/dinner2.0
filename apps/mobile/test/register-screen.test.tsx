import { render, screen, userEvent } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Register from '../app/register';
import { submitRegistration } from '../src/auth/register';
import type { RegisterFormResult } from '../src/auth/register';
import { router } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/register', () => ({
  submitRegistration: vi.fn(),
}));

const submitRegistrationMock = vi.mocked(submitRegistration);

const email = 'user@example.com';
const password = 'correct horse';

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Adres e-mail'), email);
  await user.type(screen.getByPlaceholderText('Hasło'), password);
  await user.press(screen.getByText('Zarejestruj się'));
}

beforeEach(() => {
  submitRegistrationMock.mockReset();
  router.push.mockClear();
  router.back.mockClear();
});

describe('Register screen', () => {
  it('renders the registration form initially', async () => {
    await render(<Register />);

    expect(screen.getByText('Załóż konto')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Adres e-mail')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Hasło')).toBeOnTheScreen();
    expect(screen.getByText('Zarejestruj się')).toBeOnTheScreen();
  });

  it('shows a loading state while submitting', async () => {
    let resolveSubmit!: (value: RegisterFormResult) => void;
    submitRegistrationMock.mockReturnValue(
      new Promise<RegisterFormResult>((resolve) => {
        resolveSubmit = resolve;
      }),
    );

    const user = userEvent.setup();
    await render(<Register />);

    await fillAndSubmit(user);

    expect(submitRegistrationMock).toHaveBeenCalledWith({ email, password });
    expect(screen.queryByText('Zarejestruj się')).not.toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Adres e-mail')).toBeDisabled();
    expect(screen.getByPlaceholderText('Hasło')).toBeDisabled();

    resolveSubmit({ kind: 'success' });
    expect(await screen.findByText('Konto utworzone')).toBeOnTheScreen();
  });

  it('shows the pending-activation message after success', async () => {
    submitRegistrationMock.mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();
    await render(<Register />);

    await fillAndSubmit(user);

    expect(await screen.findByText('Konto utworzone')).toBeOnTheScreen();
    expect(
      screen.getByText(
        /Twoje konto oczekuje na aktywację przez administratora/,
      ),
    ).toBeOnTheScreen();
  });

  it('presents the API error message on failure', async () => {
    submitRegistrationMock.mockResolvedValue({
      kind: 'error',
      message: 'Konto z tym adresem e-mail już istnieje.',
    });

    const user = userEvent.setup();
    await render(<Register />);

    await fillAndSubmit(user);

    expect(
      await screen.findByText('Konto z tym adresem e-mail już istnieje.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Zarejestruj się')).toBeOnTheScreen();
  });
});
