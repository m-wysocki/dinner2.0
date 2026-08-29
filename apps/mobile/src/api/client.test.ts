import { beforeEach, describe, expect, it, vi } from 'vitest';
import { healthResponseSchema } from '@dinner/shared';
import { ApiError, apiClient, request } from './client';
import {
  clearAuthenticatedState,
  setAuthenticatedState,
} from '../auth/session';

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
          emailConfirmedAt: null,
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

describe('apiClient.confirmEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs the confirmation deep link and returns the confirmed user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          emailConfirmedAt: '2026-08-27T12:00:00.000Z',
          accessStatus: 'PENDING',
          interfaceLanguage: 'pl',
        }),
      }),
    );

    const url =
      'dinner2://confirm#access_token=header.payload.signature&type=signup';

    await expect(apiClient.confirmEmail(url)).resolves.toMatchObject({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      emailConfirmedAt: '2026-08-27T12:00:00.000Z',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/confirm-email',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      },
    );
  });

  it('surfaces the safe message from a rejected confirmation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'INVALID_CONFIRMATION_LINK',
            message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
          },
        }),
      }),
    );

    await expect(
      apiClient.confirmEmail('dinner2://confirm#access_token=expired'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'INVALID_CONFIRMATION_LINK',
      message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
    });
  });
});

describe('apiClient.login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs credentials and returns the authenticated session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
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
        }),
      }),
    );

    await expect(
      apiClient.login({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toMatchObject({
      accessToken: 'header.payload.signature',
      refreshToken: 'refresh-token',
      expiresAt: 1785302400,
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/login',
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

  it('surfaces the safe message and code from rejected credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Nieprawidłowy adres e-mail lub hasło.',
          },
        }),
      }),
    );

    await expect(
      apiClient.login({
        email: 'user@example.com',
        password: 'wrong password',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Nieprawidłowy adres e-mail lub hasło.',
    });
  });
});

describe('apiClient.deleteRecipe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAuthenticatedState();
  });

  it('DELETEs the recipe with the bearer token and resolves on 204', async () => {
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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiClient.deleteRecipe('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/recipes/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer access-token' },
      },
    );
  });

  it('surfaces the safe message when deletion fails', async () => {
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 'RECIPE_NOT_FOUND',
            message: 'Nie znaleziono przepisu.',
          },
        }),
      }),
    );

    await expect(
      apiClient.deleteRecipe('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'RECIPE_NOT_FOUND',
      message: 'Nie znaleziono przepisu.',
    });
  });
});

describe('authenticated requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAuthenticatedState();
  });

  it('adds the bearer token to a protected request', async () => {
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', service: 'api' }),
      }),
    );

    await request('/health', healthResponseSchema, { authenticated: true });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/health', {
      method: 'GET',
      headers: { Authorization: 'Bearer access-token' },
    });
  });

  it('refreshes the current user through the authenticated API', async () => {
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
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          emailConfirmedAt: '2026-08-27T12:00:00.000Z',
          accessStatus: 'ACTIVE',
          interfaceLanguage: 'pl',
        }),
      }),
    );

    await expect(apiClient.currentUser()).resolves.toMatchObject({
      accessStatus: 'ACTIVE',
    });
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer access-token' },
    });
  });

  it('does not call the network without a valid session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      request('/health', healthResponseSchema, { authenticated: true }),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the session after an unauthorized protected response', async () => {
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Sesja wygasła.',
          },
        }),
      }),
    );

    await expect(
      request('/health', healthResponseSchema, { authenticated: true }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      request('/health', healthResponseSchema, { authenticated: true }),
    ).rejects.toMatchObject({
      status: 401,
    });
  });
});
