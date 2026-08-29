import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../app/user';

vi.mock('expo-router', async () => await import('./expo-router-mock'));
vi.mock('../src/auth/session', () => ({
  getAuthenticatedState: vi.fn(),
}));

import { getAuthenticatedState } from '../src/auth/session';

const getStateMock = vi.mocked(getAuthenticatedState);

beforeEach(() => {
  getStateMock.mockReset();
});

describe('User screen', () => {
  it('shows the signed-in email after a successful login', () => {
    getStateMock.mockReturnValue({
      session: {
        accessToken: 'header.payload.signature',
        refreshToken: 'refresh-token',
        expiresAt: 1785302400,
      },
      user: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: '2026-08-27T12:00:00.000Z',
        accessStatus: 'ACTIVE',
        interfaceLanguage: 'pl',
      },
    });

    render(<User />);

    expect(screen.getByText('Zalogowano')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
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
