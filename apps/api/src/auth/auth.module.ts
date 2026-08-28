import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { ActiveAccessGuard } from './active-access.guard';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, ActiveAccessGuard],
  exports: [AuthGuard, ActiveAccessGuard],
})
export class AuthModule {}
