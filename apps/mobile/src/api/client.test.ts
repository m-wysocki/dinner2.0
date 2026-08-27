import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient } from './client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a validated health response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', service: 'api' }),
      }),
    );

    await expect(apiClient.health()).resolves.toEqual({
      status: 'ok',
      service: 'api',
    });
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/health', {
      method: 'GET',
    });
  });

  it('rejects invalid responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'broken' }),
      }),
    );

    await expect(apiClient.health()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'API zwróciło nieprawidłową odpowiedź.',
    });
  });

  it('turns network and HTTP failures into ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(apiClient.health()).rejects.toBeInstanceOf(ApiError);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: { code: 'X', message: 'down' } }),
      }),
    );
    await expect(apiClient.health()).rejects.toMatchObject({ status: 503 });
  });
});

describe('apiClient.register', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs registration data and returns the validated response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          accessStatus: 'PENDING',
          interfaceLanguage: 'pl',
        }),
      }),
    );

    await expect(
      apiClient.register({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toMatchObject({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      accessStatus: 'PENDING',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'correct horse',
        }),
      },
    );
  });

  it('surfaces the safe message and code from a rejected registration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: {
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'Konto z tym adresem e-mail już istnieje.',
          },
        }),
      }),
    );

    await expect(
      apiClient.register({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'Konto z tym adresem e-mail już istnieje.',
    });
  });
});
