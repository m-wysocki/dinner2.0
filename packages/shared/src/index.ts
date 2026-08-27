import { z } from 'zod';

export const interfaceLanguageSchema = z.enum(['pl', 'en']);
export type InterfaceLanguage = z.infer<typeof interfaceLanguageSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
