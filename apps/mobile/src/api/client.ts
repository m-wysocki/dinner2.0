import {
  apiErrorSchema,
  healthResponseSchema,
  registerResponseSchema,
  type ApiErrorCode,
  type HealthResponse,
  type RegisterRequest,
  type RegisterResponse,
} from '@dinner/shared';
import { apiUrl } from '../config';

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

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

async function request<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  options: RequestOptions = {},
) {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? 'GET',
      ...(options.body !== undefined
        ? {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options.body),
          }
        : {}),
    });
  } catch {
    throw new ApiError('Nie można połączyć się z API.', 0);
  }

  if (!response.ok) {
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
    return request('/auth/register', registerResponseSchema, {
      method: 'POST',
      body: input,
    });
  },
};
