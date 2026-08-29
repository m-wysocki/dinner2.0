import { BadRequestException, Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiException } from './api-error';
import { ApiErrorFilter } from './api-error.filter';

function createHost(json: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: () => ({ json }),
      }),
    }),
  } as never;
}

describe('ApiErrorFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats ApiException with code, message, and status', () => {
    const json = vi.fn();
    const filter = new ApiErrorFilter();

    filter.catch(
      new ApiException('EMAIL_ALREADY_REGISTERED', 'Konto już istnieje.', 409),
      createHost(json),
    );

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Konto już istnieje.',
      },
    });
  });

  it('formats a validation BadRequestException with details', () => {
    const json = vi.fn();
    const filter = new ApiErrorFilter();

    filter.catch(
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane wejściowe.',
        details: [{ path: 'email', message: 'invalid' }],
      }),
      createHost(json),
    );

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane wejściowe.',
        details: [{ path: 'email', message: 'invalid' }],
      },
    });
  });

  it('formats unknown errors as an internal error', () => {
    const json = vi.fn();
    const filter = new ApiErrorFilter();

    filter.catch(new Error('boom'), createHost(json));

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Wystąpił nieoczekiwany błąd serwera.',
      },
    });
  });

  it('does not leak internal exception details to the client', () => {
    const json = vi.fn();
    const filter = new ApiErrorFilter();

    filter.catch(
      new Error('connection string postgresql://user:secret@db'),
      createHost(json),
    );

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Wystąpił nieoczekiwany błąd serwera.',
      },
    });
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('secret');
  });

  it('logs internal errors but not client errors', () => {
    const errorLog = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const json = vi.fn();
    const filter = new ApiErrorFilter();

    filter.catch(
      new ApiException('RECIPE_NOT_FOUND', 'Nie znaleziono przepisu.', 404),
      createHost(json),
    );
    filter.catch(new BadRequestException('bad request'), createHost(json));
    expect(errorLog).not.toHaveBeenCalled();

    filter.catch(new Error('database exploded'), createHost(json));
    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(errorLog).toHaveBeenCalledWith('database exploded');
  });
});
