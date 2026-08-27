import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RegisterRequest, RegisterResponse } from '@dinner/shared';
import { registerResponseSchema } from '@dinner/shared';
import { ApiException } from '../common/api-error';
import { PrismaService } from '../prisma.service';
import { SUPABASE_CLIENT } from '../supabase';

const EMAIL_ALREADY_REGISTERED = {
  code: 'EMAIL_ALREADY_REGISTERED' as const,
  message: 'Konto z tym adresem e-mail już istnieje.',
  status: 409,
};

const REGISTRATION_FAILED = {
  code: 'REGISTRATION_FAILED' as const,
  message: 'Rejestracja nie powiodła się.',
  status: 422,
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error) {
      if (error.code === 'user_already_exists') {
        throw new ApiException(
          EMAIL_ALREADY_REGISTERED.code,
          EMAIL_ALREADY_REGISTERED.message,
          EMAIL_ALREADY_REGISTERED.status,
        );
      }

      throw new ApiException(
        REGISTRATION_FAILED.code,
        REGISTRATION_FAILED.message,
        REGISTRATION_FAILED.status,
      );
    }

    if (!data.user) {
      // With email confirmation enabled, an already-registered but unconfirmed
      // email returns no user and no error; treat it as a duplicate registration.
      throw new ApiException(
        EMAIL_ALREADY_REGISTERED.code,
        EMAIL_ALREADY_REGISTERED.message,
        EMAIL_ALREADY_REGISTERED.status,
      );
    }

    let user;

    try {
      user = await this.prisma.user.create({
        data: {
          supabaseAuthId: data.user.id,
          email: input.email,
        },
      });
    } catch (error) {
      if (this.isEmailUniqueViolation(error)) {
        throw new ApiException(
          EMAIL_ALREADY_REGISTERED.code,
          EMAIL_ALREADY_REGISTERED.message,
          EMAIL_ALREADY_REGISTERED.status,
        );
      }

      throw error;
    }

    return registerResponseSchema.parse({
      id: user.id,
      email: user.email,
      accessStatus: user.accessStatus,
      interfaceLanguage: user.interfaceLanguage,
    });
  }

  private isEmailUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002' &&
      this.targetsEmail(error)
    );
  }

  private targetsEmail(error: object): boolean {
    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    return Array.isArray(target) && target.includes('email');
  }
}
