import { Body, Controller, Post } from '@nestjs/common';
import {
  registerRequestSchema,
  type RegisterRequest,
  type RegisterResponse,
} from '@dinner/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerRequestSchema)) input: RegisterRequest,
  ): Promise<RegisterResponse> {
    return this.authService.register(input);
  }
}
