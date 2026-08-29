import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  confirmEmailRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  updateUserRequestSchema,
  type ConfirmEmailRequest,
  type ConfirmEmailResponse,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
  type AuthUserResponse,
  type UpdateUserRequest,
} from '@dinner/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest): Promise<AuthUserResponse> {
    return this.authService.getCurrentUser(request.supabaseAuthId!);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateUserRequestSchema))
    input: UpdateUserRequest,
  ): Promise<AuthUserResponse> {
    return this.authService.updateCurrentUser(request.supabaseAuthId!, input);
  }

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
