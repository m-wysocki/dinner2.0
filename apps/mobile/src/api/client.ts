import {
  apiErrorSchema,
  authUserResponseSchema,
  recipeResponseSchema,
  recipeDetailsResponseSchema,
  recipeCollectionResponseSchema,
  ingredientCatalogEntrySchema,
  healthResponseSchema,
  loginResponseSchema,
  type ApiErrorCode,
  type ConfirmEmailResponse,
  type HealthResponse,
  type AuthUserResponse,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
  type CreateRecipeRequest,
  type UpdateRecipeRequest,
  type RecipeResponse,
  type RecipeDetailsResponse,
  type RecipeCollectionResponse,
  type IngredientCatalogEntry,
  type CreateCustomIngredientRequest,
  type UpdateUserRequest,
} from '@dinner/shared';
import { apiUrl } from '../config';
import { translate } from '../i18n/i18n';
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
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
}

export async function request<T>(
  path: string,
  schema: { parse: (value: unknown) => T } | undefined,
  options: RequestOptions = {},
) {
  const authenticated = options.authenticated ?? false;
  const state = authenticated ? getAuthenticatedState() : null;

  if (authenticated && (!state || !hasValidAuthenticatedState())) {
    clearAuthenticatedState();
    throw new ApiError(
      translate('api.sessionExpired'),
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
    throw new ApiError(translate('api.networkError'), 0);
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
      translate('api.httpError', { status: response.status }),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!schema) {
    throw new ApiError(translate('api.invalidResponse'), response.status);
  }

  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError(translate('api.invalidResponse'), response.status);
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

  currentUser(): Promise<AuthUserResponse> {
    return request('/auth/me', authUserResponseSchema, {
      authenticated: true,
    });
  },

  updateUser(input: UpdateUserRequest): Promise<AuthUserResponse> {
    return request('/auth/me', authUserResponseSchema, {
      method: 'PATCH',
      body: input,
      authenticated: true,
    });
  },

  createRecipe(input: CreateRecipeRequest): Promise<RecipeResponse> {
    return request('/recipes', recipeResponseSchema, {
      method: 'POST',
      body: input,
      authenticated: true,
    });
  },

  listRecipes(): Promise<RecipeCollectionResponse> {
    return request('/recipes', recipeCollectionResponseSchema, {
      authenticated: true,
    });
  },

  getRecipe(id: string): Promise<RecipeDetailsResponse> {
    return request(
      `/recipes/${encodeURIComponent(id)}`,
      recipeDetailsResponseSchema,
      {
        authenticated: true,
      },
    );
  },

  updateRecipe(
    id: string,
    input: UpdateRecipeRequest,
  ): Promise<RecipeDetailsResponse> {
    return request(
      `/recipes/${encodeURIComponent(id)}`,
      recipeDetailsResponseSchema,
      {
        method: 'PATCH',
        body: input,
        authenticated: true,
      },
    );
  },

  deleteRecipe(id: string): Promise<void> {
    return request<void>(`/recipes/${encodeURIComponent(id)}`, undefined, {
      method: 'DELETE',
      authenticated: true,
    });
  },

  ingredientCatalog(): Promise<IngredientCatalogEntry[]> {
    return request(
      '/ingredient-catalog',
      {
        parse: (value: unknown) =>
          ingredientCatalogEntrySchema.array().parse(value),
      },
      { authenticated: true },
    );
  },

  createCustomIngredient(
    input: CreateCustomIngredientRequest,
  ): Promise<IngredientCatalogEntry> {
    return request('/ingredient-catalog/custom', ingredientCatalogEntrySchema, {
      method: 'POST',
      body: input,
      authenticated: true,
    });
  },
};
