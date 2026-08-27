import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT, createSupabaseClient } from './supabase';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: createSupabaseClient,
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
