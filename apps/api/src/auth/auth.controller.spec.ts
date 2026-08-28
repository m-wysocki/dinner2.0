import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('delegates registration to the auth service', async () => {
    const register = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    const controller = new AuthController({ register } as never);

    await expect(
      controller.register({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    expect(register).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'correct horse',
    });
  });

  it('delegates login to the auth service', async () => {
    const login = vi.fn().mockResolvedValue({
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
    });

    const controller = new AuthController({ login } as never);

    await expect(
      controller.login({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({
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
    });

    expect(login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'correct horse',
    });
  });
});
