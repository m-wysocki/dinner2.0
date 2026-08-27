import { z } from 'zod';

export const interfaceLanguageSchema = z.enum(['pl', 'en']);
export type InterfaceLanguage = z.infer<typeof interfaceLanguageSchema>;

export const accessStatusSchema = z.enum(['PENDING', 'ACTIVE']);
export type AccessStatus = z.infer<typeof accessStatusSchema>;

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

export const registerResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  accessStatus: accessStatusSchema,
  interfaceLanguage: interfaceLanguageSchema,
});
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'EMAIL_ALREADY_REGISTERED',
  'REGISTRATION_FAILED',
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
