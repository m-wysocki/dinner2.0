import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validateEnvironment } from './config';
import { DatabaseModule } from './database.module';
import { SupabaseModule } from './supabase.module';

@Module({
  imports: [
    DatabaseModule,
    SupabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
