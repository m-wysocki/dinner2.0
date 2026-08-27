import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './config';

const validEnvironment = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/dinner',
};

describe('environment configuration', () => {
  it('validates and defaults the API port', () => {
    expect(validateEnvironment(validEnvironment)).toEqual({
      ...validEnvironment,
      API_PORT: 3000,
    });
  });

  it('reports invalid field names without exposing secret values', () => {
    const secret = 'do-not-leak-this-value';

    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        SUPABASE_ANON_KEY: secret,
        DATABASE_URL: 'not-a-database-url',
      }),
    ).toThrow(/DATABASE_URL/);

    try {
      validateEnvironment({
        ...validEnvironment,
        SUPABASE_ANON_KEY: '',
        DATABASE_URL: 'not-a-database-url',
      });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});
