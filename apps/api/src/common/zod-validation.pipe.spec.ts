import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { registerRequestSchema } from '@dinner/shared';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(registerRequestSchema);

  it('returns normalized data for a valid body', () => {
    expect(
      pipe.transform({
        email: ' User@Example.COM ',
        password: 'correct horse',
      }),
    ).toEqual({
      email: 'user@example.com',
      password: 'correct horse',
    });
  });

  it('rejects an invalid body with a predictable validation error', () => {
    try {
      pipe.transform({ email: 'not-an-email', password: 'short' });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
        message: string;
        details: { path: string }[];
      };
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'email' }),
          expect.objectContaining({ path: 'password' }),
        ]),
      );
    }
  });
});
