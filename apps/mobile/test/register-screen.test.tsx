import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  await user.click(screen.getByText('Zarejestruj się'));
}

beforeEach(() => {
  submitRegistrationMock.mockReset();
  router.push.mockClear();
  router.back.mockClear();
});

describe('Register screen', () => {
  it('renders the registration form initially', () => {
    render(<Register />);

    expect(screen.getByText('Załóż konto')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Adres e-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hasło')).toBeInTheDocument();
    expect(screen.getByText('Zarejestruj się')).toBeInTheDocument();
  });

  it('shows a loading state while submitting', async () => {
    let resolveSubmit!: (value: RegisterFormResult) => void;
    submitRegistrationMock.mockReturnValue(
      new Promise<RegisterFormResult>((resolve) => {
        resolveSubmit = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<Register />);

    await fillAndSubmit(user);

    expect(submitRegistrationMock).toHaveBeenCalledWith({ email, password });
    expect(screen.queryByText('Zarejestruj się')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Adres e-mail')).toHaveAttribute(
      'readonly',
    );
    expect(screen.getByPlaceholderText('Hasło')).toHaveAttribute('readonly');

    resolveSubmit({ kind: 'success' });
    expect(await screen.findByText('Konto utworzone')).toBeInTheDocument();
  });

  it('shows the pending-activation message after success', async () => {
    submitRegistrationMock.mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();
    render(<Register />);

    await fillAndSubmit(user);

    expect(await screen.findByText('Konto utworzone')).toBeInTheDocument();
    expect(
      screen.getByText(/oczekiwać na aktywację przez administratora/),
    ).toBeInTheDocument();
  });

  it('presents the API error message on failure', async () => {
    submitRegistrationMock.mockResolvedValue({
      kind: 'error',
      message: 'Konto z tym adresem e-mail już istnieje.',
    });

    const user = userEvent.setup();
    render(<Register />);

    await fillAndSubmit(user);

    expect(
      await screen.findByText('Konto z tym adresem e-mail już istnieje.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Zarejestruj się')).toBeInTheDocument();
  });
});
