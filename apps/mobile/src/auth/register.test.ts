import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitRegistration } from './register';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return { ...actual, apiClient: { register: vi.fn() } };
});

import { ApiError, apiClient } from '../api/client';

const registerMock = apiClient.register as ReturnType<typeof vi.fn>;

describe('submitRegistration', () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  it('returns success after a successful registration', async () => {
    registerMock.mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    await expect(
      submitRegistration({
        email: 'User@Example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({ kind: 'success' });

    expect(registerMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'correct horse',
    });
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await submitRegistration({
      email: 'not-an-email',
      password: 'short',
    });

    expect(result.kind).toBe('invalid');
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('surfaces the safe error message from the API', async () => {
    registerMock.mockRejectedValue(
      new ApiError('Konto z tym adresem e-mail już istnieje.', 409),
    );

    await expect(
      submitRegistration({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Konto z tym adresem e-mail już istnieje.',
    });
  });

  it('falls back to a generic message for unexpected failures', async () => {
    registerMock.mockRejectedValue(new Error('boom'));

    await expect(
      submitRegistration({
        email: 'user@example.com',
        password: 'correct horse',
      }),
    ).resolves.toEqual({
      kind: 'error',
      message: 'Wystąpił nieoczekiwany błąd.',
    });
  });
});
