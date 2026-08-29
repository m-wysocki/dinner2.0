import type { LoginRequest } from '@dinner/shared';
import { loginRequestSchema } from '@dinner/shared';
import { ApiError, apiClient } from '../api/client';
import { translate } from '../i18n/i18n';
import { setAuthenticatedState } from './session';

export type LoginForm = LoginRequest;

export type LoginFormResult =
  | { kind: 'success' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

export async function submitLogin(form: LoginForm): Promise<LoginFormResult> {
  const parsed = loginRequestSchema.safeParse(form);

  if (!parsed.success) {
    return {
      kind: 'invalid',
      message: translate('auth.invalidForm'),
    };
  }

  try {
    const response = await apiClient.login(parsed.data);

    await setAuthenticatedState({
      session: {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      },
      user: response.user,
    });

    return { kind: 'success' };
  } catch (error) {
    if (error instanceof ApiError) {
      return { kind: 'error', message: error.message };
    }

    return { kind: 'error', message: translate('auth.unexpectedError') };
  }
}
