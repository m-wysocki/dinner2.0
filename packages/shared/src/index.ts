import { z } from 'zod';

export const interfaceLanguageSchema = z.enum(['pl', 'en']);
export type InterfaceLanguage = z.infer<typeof interfaceLanguageSchema>;

export const accessStatusSchema = z.enum(['PENDING', 'ACTIVE']);
export type AccessStatus = z.infer<typeof accessStatusSchema>;

export const canonicalUnitSchema = z.enum([
  'G',
  'KG',
  'ML',
  'L',
  'PCS',
  'TSP',
  'TBSP',
  'OTHER',
]);
export type CanonicalUnit = z.infer<typeof canonicalUnitSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const authUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailConfirmedAt: z.string().datetime().nullable(),
  accessStatus: accessStatusSchema,
  interfaceLanguage: interfaceLanguageSchema,
});
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;

export type RegisterResponse = AuthUserResponse;
export type ConfirmEmailResponse = AuthUserResponse;

export const confirmEmailRequestSchema = z.object({
  url: z.string().min(1),
});
export type ConfirmEmailRequest = z.infer<typeof confirmEmailRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().positive(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;

export const loginResponseSchema = authSessionSchema.extend({
  user: authUserResponseSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'EMAIL_ALREADY_REGISTERED',
  'REGISTRATION_FAILED',
  'INVALID_CONFIRMATION_LINK',
  'EMAIL_NOT_CONFIRMED',
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'ACCESS_PENDING',
  'HTTP_ERROR',
  'INTERNAL_ERROR',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.array(apiErrorDetailSchema).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const createRecipeRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  servingCount: z.number().int().min(1).max(1000),
});
export type CreateRecipeRequest = z.infer<typeof createRecipeRequestSchema>;

export const recipeResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  servingCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RecipeResponse = z.infer<typeof recipeResponseSchema>;
