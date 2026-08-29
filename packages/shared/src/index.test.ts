import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  accessStatusSchema,
  authUserResponseSchema,
  canonicalUnitSchema,
  confirmEmailRequestSchema,
  createRecipeRequestSchema,
  updateRecipeRequestSchema,
  interfaceLanguageSchema,
  loginRequestSchema,
  loginResponseSchema,
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

  it('accepts only canonical ingredient units', () => {
    expect(canonicalUnitSchema.parse('G')).toBe('G');
    expect(canonicalUnitSchema.parse('TBSP')).toBe('TBSP');
    expect(canonicalUnitSchema.parse('OTHER')).toBe('OTHER');
    expect(canonicalUnitSchema.safeParse('gram').success).toBe(false);
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

describe('login request contract', () => {
  it('accepts valid credentials and normalizes the email', () => {
    const parsed = loginRequestSchema.parse({
      email: '  User@Example.COM ',
      password: 'correct horse',
    });

    expect(parsed).toEqual({
      email: 'user@example.com',
      password: 'correct horse',
    });
  });

  it('rejects an invalid email', () => {
    expect(
      loginRequestSchema.safeParse({
        email: 'not-an-email',
        password: 'correct horse',
      }).success,
    ).toBe(false);
  });

  it('rejects a password that is too short', () => {
    expect(
      loginRequestSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      }).success,
    ).toBe(false);
  });
});

describe('login response contract', () => {
  it('accepts a session with its authenticated user', () => {
    const response = {
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

    expect(loginResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects a response without session tokens', () => {
    expect(
      loginResponseSchema.safeParse({
        accessToken: '',
        refreshToken: 'refresh-token',
        expiresAt: 1785302400,
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          emailConfirmedAt: null,
          accessStatus: 'PENDING',
          interfaceLanguage: 'pl',
        },
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
    expect(
      apiErrorSchema.parse({
        error: { code: 'INVALID_CREDENTIALS', message: 'safe message' },
      }).error.code,
    ).toBe('INVALID_CREDENTIALS');
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

describe('recipe contracts', () => {
  it('accepts and trims basic recipe data', () => {
    expect(
      createRecipeRequestSchema.parse({
        title: '  Zupa  ',
        description: '  Domowa  ',
        servingCount: 4,
      }),
    ).toEqual({ title: 'Zupa', description: 'Domowa', servingCount: 4 });
  });

  it('requires a non-empty title and positive serving count', () => {
    expect(
      createRecipeRequestSchema.safeParse({
        title: ' ',
        servingCount: 0,
      }).success,
    ).toBe(false);
  });

  it('rejects empty preparation steps and accepts ordered text', () => {
    expect(
      createRecipeRequestSchema.safeParse({
        title: 'Zupa',
        servingCount: 4,
        preparationSteps: [{ text: ' ', position: 0 }],
      }).success,
    ).toBe(false);
    expect(
      createRecipeRequestSchema.parse({
        title: 'Zupa',
        servingCount: 4,
        preparationSteps: [{ text: 'Gotuj', position: 0 }],
      }).preparationSteps,
    ).toEqual([{ text: 'Gotuj', position: 0 }]);
    expect(
      createRecipeRequestSchema.safeParse({
        title: 'Zupa',
        servingCount: 4,
        preparationSteps: [
          { text: 'Gotuj', position: 0 },
          { text: 'Podaj', position: 0 },
        ],
      }).success,
    ).toBe(false);
  });

  it('accepts positive decimal quantities with up to six fractional digits', () => {
    expect(
      createRecipeRequestSchema.parse({
        title: 'Zupa',
        servingCount: 4,
        ingredients: [
          {
            catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
            name: 'Pomidor',
            quantity: '0.5',
            unit: 'KG',
            position: 0,
          },
          {
            catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
            name: 'Mąka',
            quantity: '10.123456',
            unit: 'G',
            position: 1,
          },
        ],
      }).ingredients,
    ).toMatchObject([{ quantity: '0.5' }, { quantity: '10.123456' }]);
  });

  it('rejects zero, negative, malformed, or over-precise quantities', () => {
    const base = {
      title: 'Zupa',
      servingCount: 4,
      ingredients: [
        {
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          name: 'Pomidor',
          unit: 'PCS',
          position: 0,
        },
      ],
    };

    for (const quantity of [
      '0',
      '0.000',
      '-2',
      'abc',
      '.5',
      '1.',
      '1.1234567',
    ]) {
      expect(
        createRecipeRequestSchema.safeParse({
          ...base,
          ingredients: [{ ...base.ingredients[0], quantity }],
        }).success,
      ).toBe(false);
    }
  });

  it('accepts an ingredient without a quantity for expressions such as "to taste"', () => {
    const result = createRecipeRequestSchema.parse({
      title: 'Zupa',
      servingCount: 4,
      ingredients: [
        {
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          name: 'Sól',
          quantity: null,
          unit: 'OTHER',
          position: 0,
        },
      ],
    });
    expect(result.ingredients?.[0].quantity).toBeNull();
  });
});

describe('update recipe request contract', () => {
  const valid = {
    title: 'Zupa',
    servingCount: 4,
    ingredients: [],
    preparationSteps: [],
  };

  it('accepts a full recipe update', () => {
    expect(updateRecipeRequestSchema.parse(valid)).toEqual(valid);
  });

  it('requires ingredients and preparation steps to be present', () => {
    expect(
      updateRecipeRequestSchema.safeParse({
        title: 'Zupa',
        servingCount: 4,
      }).success,
    ).toBe(false);
  });

  it('rejects ingredients without a canonical identity', () => {
    expect(
      updateRecipeRequestSchema.safeParse({
        ...valid,
        ingredients: [
          {
            catalogEntryId: 'not-a-uuid',
            name: 'Pomidor',
            unit: 'PCS',
            position: 0,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects ingredients with non-consecutive positions', () => {
    expect(
      updateRecipeRequestSchema.safeParse({
        ...valid,
        ingredients: [
          {
            catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
            name: 'Pomidor',
            unit: 'PCS',
            position: 0,
          },
          {
            catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
            name: 'Cebula',
            unit: 'PCS',
            position: 0,
          },
        ],
      }).success,
    ).toBe(false);
  });
});
