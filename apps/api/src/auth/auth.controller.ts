import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  confirmEmailRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  type ConfirmEmailRequest,
  type ConfirmEmailResponse,
  type LoginRequest,
  type LoginResponse,
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

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  confirmEmail(
    @Body(new ZodValidationPipe(confirmEmailRequestSchema))
    input: ConfirmEmailRequest,
  ): Promise<ConfirmEmailResponse> {
    return this.authService.confirmEmail(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) input: LoginRequest,
  ): Promise<LoginResponse> {
    return this.authService.login(input);
  }
}
