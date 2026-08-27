import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import type { Environment } from './config';

export const SUPABASE_CLIENT = Symbol('SUPABASE_CLIENT');

export function createSupabaseClient(
  configService: ConfigService<Environment, true>,
): SupabaseClient {
  return createClient(
    configService.getOrThrow('SUPABASE_URL'),
    configService.getOrThrow('SUPABASE_ANON_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
