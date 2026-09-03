import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../app/user';
import { router } from './expo-router-mock';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/session', () => ({
  getAuthenticatedState: vi.fn(),
  clearAuthenticatedState: vi.fn(),
  subscribeToSession: vi.fn(() => () => undefined),
}));

import { clearAuthenticatedState, getAuthenticatedState } from '../src/auth/session';

const getStateMock = vi.mocked(getAuthenticatedState);
const clearStateMock = vi.mocked(clearAuthenticatedState);

const activeState = {
  session: {
    accessToken: 'header.payload.signature',
    refreshToken: 'refresh-token',
    expiresAt: 1785302400,
  },
  user: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'user@example.com',
    emailConfirmedAt: '2026-08-27T12:00:00.000Z',
    accessStatus: 'ACTIVE' as const,
    interfaceLanguage: 'pl' as const,
  },
};

beforeEach(() => {
  getStateMock.mockReset();
  clearStateMock.mockClear();
  router.replace.mockClear();
});

describe('User screen', () => {
  it('shows the signed-in email after a successful login', () => {
    getStateMock.mockReturnValue(activeState);

    render(<User />);

    expect(screen.getByText('Zalogowano')).toBeInTheDocument();
    // The email shows in the screen body and once in the sidebar user control.
    expect(screen.getAllByText('user@example.com').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/możesz zarządzać swoimi przepisami/),
    ).toBeInTheDocument();
  });

  it('renders nothing when there is no authenticated session', () => {
    getStateMock.mockReturnValue(null);

    render(<User />);

    expect(screen.queryByText('Zalogowano')).not.toBeInTheDocument();
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('signs out without a confirmation and lands on the login screen', async () => {
    getStateMock.mockReturnValue(activeState);
    const user = userEvent.setup();
    render(<User />);

    await user.click(screen.getByText('Wyloguj się'));

    expect(clearAuthenticatedState).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('shows the activation waiting state for a pending user', () => {
    getStateMock.mockReturnValue({
      session: {
        accessToken: 'header.payload.signature',
        refreshToken: 'refresh-token',
        expiresAt: 1785302400,
      },
      user: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'pending@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      },
    });

    render(<User />);

    expect(screen.getByText('Oczekiwanie na aktywację')).toBeInTheDocument();
    expect(
      screen.getByText(/administrator nie aktywował jeszcze dostępu/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Zalogowano')).not.toBeInTheDocument();
  });
});
