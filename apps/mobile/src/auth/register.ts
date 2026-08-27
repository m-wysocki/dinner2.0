import type { RegisterRequest } from '@dinner/shared';
import { registerRequestSchema } from '@dinner/shared';
import { ApiError, apiClient } from '../api/client';

export type RegisterForm = RegisterRequest;

export type RegisterFormResult =
  | { kind: 'success' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

export async function submitRegistration(
  form: RegisterForm,
): Promise<RegisterFormResult> {
  const parsed = registerRequestSchema.safeParse(form);

  if (!parsed.success) {
    return {
      kind: 'invalid',
      message: 'Podaj poprawny adres e-mail i hasło (minimum 8 znaków).',
    };
  }

  try {
    await apiClient.register(parsed.data);
    return { kind: 'success' };
  } catch (error) {
    if (error instanceof ApiError) {
      return { kind: 'error', message: error.message };
    }

    return { kind: 'error', message: 'Wystąpił nieoczekiwany błąd.' };
  }
}
