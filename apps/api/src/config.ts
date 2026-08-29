import { z } from 'zod';

const environmentSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  OPENAI_API_KEY: z.string().min(1),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join('.') || 'environment')
      .join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }

  return result.data;
}
