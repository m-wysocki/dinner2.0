import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  accessStatusSchema,
  authUserResponseSchema,
  confirmEmailRequestSchema,
  interfaceLanguageSchema,
  registerRequestSchema,
} from './index.js';

describe('shared contracts', () => {
  it('accepts supported interface languages', () => {
    expect(interfaceLanguageSchema.parse('pl')).toBe('pl');
    expect(interfaceLanguageSchema.parse('en')).toBe('en');
  });

  it('rejects unsupported interface languages', () => {
    expect(interfaceLanguageSchema.safeParse('de').success).toBe(false);
  });

  it('accepts supported access statuses', () => {
    expect(accessStatusSchema.parse('PENDING')).toBe('PENDING');
    expect(accessStatusSchema.parse('ACTIVE')).toBe('ACTIVE');
  });

  it('rejects unsupported access statuses', () => {
    expect(accessStatusSchema.safeParse('BLOCKED').success).toBe(false);
  });
});

describe('register request contract', () => {
  it('accepts a valid registration and normalizes the email', () => {
    const parsed = registerRequestSchema.parse({
      email: '  User@Example.COM ',
      password: 'correct horse',
    });

    expect(parsed).toEqual({
      email: 'user@example.com',
      password: 'correct horse',
    });
  });

  it('rejects an invalid email', () => {
    const result = registerRequestSchema.safeParse({
      email: 'not-an-email',
      password: 'correct horse',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a password that is too short or too long', () => {
    expect(
      registerRequestSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      }).success,
    ).toBe(false);

    expect(
      registerRequestSchema.safeParse({
        email: 'user@example.com',
        password: 'a'.repeat(73),
      }).success,
    ).toBe(false);
  });
});

describe('auth user response contract', () => {
  it('accepts a pending registration response', () => {
    const response = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      emailConfirmedAt: null,
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    };

    expect(authUserResponseSchema.parse(response)).toEqual(response);
  });

  it('accepts a confirmed-email response', () => {
    const response = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
      emailConfirmedAt: '2026-08-27T12:00:00.000Z',
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    };

    expect(authUserResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects an unsupported access status', () => {
    expect(
      authUserResponseSchema.safeParse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: null,
        accessStatus: 'ACTIVE',
        interfaceLanguage: 'en',
      }).success,
    ).toBe(true);

    expect(
      authUserResponseSchema.safeParse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: null,
        accessStatus: 'GONE',
        interfaceLanguage: 'pl',
      }).success,
    ).toBe(false);
  });

  it('rejects a non-datetime confirmation timestamp', () => {
    expect(
      authUserResponseSchema.safeParse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: 'not-a-date',
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      }).success,
    ).toBe(false);
  });
});

describe('confirm email request contract', () => {
  it('accepts a confirmation deep link', () => {
    const url =
      'dinner2://confirm#access_token=header.payload.signature&type=signup';
    expect(confirmEmailRequestSchema.parse({ url })).toEqual({ url });
  });

  it('rejects an empty confirmation link', () => {
    expect(confirmEmailRequestSchema.safeParse({ url: '' }).success).toBe(
      false,
    );
  });
});

describe('api error contract', () => {
  it('accepts the predictable error shape', () => {
    const body = {
      error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'safe message' },
    };

    expect(apiErrorSchema.parse(body)).toEqual(body);
  });

  it('accepts email-confirmation error codes', () => {
    expect(
      apiErrorSchema.parse({
        error: { code: 'INVALID_CONFIRMATION_LINK', message: 'safe message' },
      }).error.code,
    ).toBe('INVALID_CONFIRMATION_LINK');
    expect(
      apiErrorSchema.parse({
        error: { code: 'EMAIL_NOT_CONFIRMED', message: 'safe message' },
      }).error.code,
    ).toBe('EMAIL_NOT_CONFIRMED');
    expect(
      apiErrorSchema.parse({
        error: { code: 'USER_NOT_FOUND', message: 'safe message' },
      }).error.code,
    ).toBe('USER_NOT_FOUND');
  });

  it('accepts optional validation details', () => {
    const body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'safe message',
        details: [{ path: 'email', message: 'invalid' }],
      },
    };

    expect(apiErrorSchema.parse(body)).toEqual(body);
  });

  it('rejects unknown error codes', () => {
    expect(
      apiErrorSchema.safeParse({
        error: { code: 'NOT_A_REAL_CODE', message: 'x' },
      }).success,
    ).toBe(false);
  });

  it('rejects a body without the error wrapper', () => {
    expect(apiErrorSchema.safeParse({ code: 'X' }).success).toBe(false);
  });
});
