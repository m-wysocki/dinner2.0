import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ApiErrorFilter } from './common/api-error.filter';
import { validateEnvironment } from './config';
import { DatabaseModule } from './database.module';
import { SupabaseModule } from './supabase.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [
    DatabaseModule,
    SupabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath: ['.env', '../../.env'],
    }),
    AuthModule,
    RecipesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter,
    },
  ],
})
export class AppModule {}
