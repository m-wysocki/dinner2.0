import type { LoginRequest } from '@dinner/shared';
import { loginRequestSchema } from '@dinner/shared';
import { ApiError, apiClient } from '../api/client';
import { setAuthenticatedState } from './session';

export type LoginForm = LoginRequest;

export type LoginFormResult =
  | { kind: 'success' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

const ACCESS_PENDING_MESSAGE = 'Konto oczekuje na akceptację administratora.';

export async function submitLogin(form: LoginForm): Promise<LoginFormResult> {
  const parsed = loginRequestSchema.safeParse(form);

  if (!parsed.success) {
    return {
      kind: 'invalid',
      message: 'Podaj poprawny adres e-mail i hasło (minimum 8 znaków).',
    };
  }

  try {
    const response = await apiClient.login(parsed.data);

    if (response.user.accessStatus !== 'ACTIVE') {
      return { kind: 'error', message: ACCESS_PENDING_MESSAGE };
    }

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

    return { kind: 'error', message: 'Wystąpił nieoczekiwany błąd.' };
  }
}
