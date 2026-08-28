import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitLogin } from './login';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return { ...actual, apiClient: { login: vi.fn() } };
});

import { ApiError, apiClient } from '../api/client';
import { clearAuthenticatedState, getAuthenticatedState } from './session';

const loginMock = apiClient.login as ReturnType<typeof vi.fn>;

const loginResponse = {
  accessToken: 'header.payload.signature',
  refreshToken: 'refresh-token',
  expiresAt: 1785302400,
  user: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'user@example.com',
    emailConfirmedAt: '2026-08-27T12:00:00.000Z',
    accessStatus: 'ACTIVE',
    interfaceLanguage: 'pl',
  },
};

describe('submitLogin', () => {
  beforeEach(() => {
    loginMock.mockReset();
    clearAuthenticatedState();
  });

  it('establishes an authenticated session after a successful login', async () => {
    loginMock.mockResolvedValue(loginResponse);

    await expect(
      submitLogin({
        email: 'User@Example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({ kind: 'success' });

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'correct horse',
    });
    expect(getAuthenticatedState()).toEqual({
      session: {
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        expiresAt: loginResponse.expiresAt,
      },
      user: loginResponse.user,
    });
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await submitLogin({
      email: 'not-an-email',
      password: 'short',
    });

    expect(result.kind).toBe('invalid');
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('surfaces the safe error message from the API', async () => {
    loginMock.mockRejectedValue(
      new ApiError('Nieprawidłowy adres e-mail lub hasło.', 401),
    );

    await expect(
      submitLogin({
        email: 'user@example.com',
        password: 'wrong password',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Nieprawidłowy adres e-mail lub hasło.',
    });
  });

  it('establishes a session for a pending user', async () => {
    loginMock.mockResolvedValue({
      ...loginResponse,
      user: { ...loginResponse.user, accessStatus: 'PENDING' },
    });

    await expect(
      submitLogin({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({ kind: 'success' });

    expect(getAuthenticatedState()?.user.accessStatus).toBe('PENDING');
  });

  it('falls back to a generic message for unexpected failures', async () => {
    loginMock.mockRejectedValue(new Error('boom'));

    await expect(
      submitLogin({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Wystąpił nieoczekiwany błąd.',
    });
  });
});
