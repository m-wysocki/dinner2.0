import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmEmailViaLink } from './confirm';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return { ...actual, apiClient: { confirmEmail: vi.fn() } };
});

import { ApiError, apiClient } from '../api/client';

const confirmMock = apiClient.confirmEmail as ReturnType<typeof vi.fn>;

const url = 'dinner2://confirm#access_token=header.payload.signature';

describe('confirmEmailViaLink', () => {
  beforeEach(() => {
    confirmMock.mockReset();
  });

  it('returns success after the API confirms the email', async () => {
    confirmMock.mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      emailConfirmedAt: '2026-08-27T12:00:00.000Z',
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    await expect(confirmEmailViaLink(url)).resolves.toEqual({
      kind: 'success',
    });

    expect(confirmMock).toHaveBeenCalledWith(url);
  });

  it('rejects an empty link without calling the API', async () => {
    const result = await confirmEmailViaLink('');

    expect(result.kind).toBe('invalid');
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('surfaces the safe error message from the API', async () => {
    confirmMock.mockRejectedValue(
      new ApiError('Link potwierdzający jest nieprawidłowy lub wygasł.', 400),
    );

    await expect(confirmEmailViaLink(url)).resolves.toEqual({
      kind: 'error',
      message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
    });
  });

  it('falls back to a generic message for unexpected failures', async () => {
    confirmMock.mockRejectedValue(new Error('boom'));

    await expect(confirmEmailViaLink(url)).resolves.toEqual({
      kind: 'error',
      message: 'Wystąpił nieoczekiwany błąd.',
    });
  });
});
