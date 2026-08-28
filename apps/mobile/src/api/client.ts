import {
  apiErrorSchema,
  authUserResponseSchema,
  healthResponseSchema,
  loginResponseSchema,
  type ApiErrorCode,
  type ConfirmEmailResponse,
  type HealthResponse,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '@dinner/shared';
import { apiUrl } from '../config';
import {
  clearAuthenticatedState,
  getAuthenticatedState,
  hasValidAuthenticatedState,
} from '../auth/session';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;

  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  authenticated?: boolean;
}

export async function request<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  options: RequestOptions = {},
) {
  const authenticated = options.authenticated ?? false;
  const state = authenticated ? getAuthenticatedState() : null;

  if (authenticated && (!state || !hasValidAuthenticatedState())) {
    clearAuthenticatedState();
    throw new ApiError(
      'Sesja wygasła. Zaloguj się ponownie.',
      401,
      'INVALID_CREDENTIALS',
    );
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? 'GET',
      ...(authenticated || options.body !== undefined
        ? {
            headers: {
              ...(options.body !== undefined
                ? { 'Content-Type': 'application/json' }
                : {}),
              ...(state
                ? { Authorization: `Bearer ${state.session.accessToken}` }
                : {}),
            },
            ...(options.body !== undefined
              ? { body: JSON.stringify(options.body) }
              : {}),
          }
        : {}),
    });
  } catch {
    throw new ApiError('Nie można połączyć się z API.', 0);
  }

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearAuthenticatedState();
    }
    const body = await response.json().catch(() => undefined);
    const parsed = apiErrorSchema.safeParse(body);

    if (parsed.success) {
      throw new ApiError(
        parsed.data.error.message,
        response.status,
        parsed.data.error.code,
      );
    }

    throw new ApiError(
      `API zwróciło błąd (${response.status}).`,
      response.status,
    );
  }

  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError(
      'API zwróciło nieprawidłową odpowiedź.',
      response.status,
    );
  }
}

export const apiClient = {
  health(): Promise<HealthResponse> {
    return request('/health', healthResponseSchema);
  },

  register(input: RegisterRequest): Promise<RegisterResponse> {
    return request('/auth/register', authUserResponseSchema, {
      method: 'POST',
      body: input,
    });
  },

  confirmEmail(url: string): Promise<ConfirmEmailResponse> {
    return request('/auth/confirm-email', authUserResponseSchema, {
      method: 'POST',
      body: { url },
    });
  },

  login(input: LoginRequest): Promise<LoginResponse> {
    return request('/auth/login', loginResponseSchema, {
      method: 'POST',
      body: input,
    });
  },
};
