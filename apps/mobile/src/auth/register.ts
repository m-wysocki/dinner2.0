import type { RegisterRequest } from '@dinner/shared';
import { registerRequestSchema } from '@dinner/shared';
import { ApiError, apiClient } from '../api/client';
import { translate } from '../i18n/i18n';

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
      message: translate('auth.invalidForm'),
    };
  }

  try {
    await apiClient.register(parsed.data);
    return { kind: 'success' };
  } catch (error) {
    if (error instanceof ApiError) {
      return { kind: 'error', message: error.message };
    }

    return { kind: 'error', message: translate('auth.unexpectedError') };
  }
}
