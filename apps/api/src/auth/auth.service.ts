import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@prisma/client';
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@dinner/shared';
import { authUserResponseSchema } from '@dinner/shared';
import type { AuthUserResponse } from '@dinner/shared';
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

const INVALID_CONFIRMATION_LINK = {
  code: 'INVALID_CONFIRMATION_LINK' as const,
  message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
  status: 400,
};

const EMAIL_NOT_CONFIRMED = {
  code: 'EMAIL_NOT_CONFIRMED' as const,
  message: 'Adres e-mail nie został jeszcze potwierdzony.',
  status: 422,
};

const USER_NOT_FOUND = {
  code: 'USER_NOT_FOUND' as const,
  message: 'Nie znaleziono konta powiązanego z tym linkiem.',
  status: 404,
};

const INVALID_CREDENTIALS = {
  code: 'INVALID_CREDENTIALS' as const,
  message: 'Nieprawidłowy adres e-mail lub hasło.',
  status: 401,
};

const ACCESS_PENDING = {
  code: 'ACCESS_PENDING' as const,
  message: 'Konto oczekuje na akceptację administratora.',
  status: 403,
};

const EMAIL_CONFIRMATION_REQUIRED = {
  code: 'EMAIL_NOT_CONFIRMED' as const,
  message:
    'Potwierdź najpierw adres e-mail. Sprawdź link potwierdzający wysłany w wiadomości od nas.',
  status: 422,
};

// Supabase sessions normally carry an explicit expiry; this fallback only
// applies when the session object omits it.
const DEFAULT_SESSION_TTL_MS = 3600_000;

// The confirmation email link must return to the mobile app so the
// confirmation deep link is handled through the Supabase Auth flow.
const EMAIL_REDIRECT_TO = 'dinner2://confirm';

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
      options: { emailRedirectTo: EMAIL_REDIRECT_TO },
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
      if (this.isPrismaError(error, 'P2002') && this.targetsEmail(error)) {
        throw new ApiException(
          EMAIL_ALREADY_REGISTERED.code,
          EMAIL_ALREADY_REGISTERED.message,
          EMAIL_ALREADY_REGISTERED.status,
        );
      }

      throw error;
    }

    return this.toAuthUserResponse(user);
  }

  async confirmEmail(
    input: ConfirmEmailRequest,
  ): Promise<ConfirmEmailResponse> {
    const confirmationLink = parseConfirmationLink(input.url);

    if (!confirmationLink || confirmationLink.type !== 'signup') {
      throw new ApiException(
        INVALID_CONFIRMATION_LINK.code,
        INVALID_CONFIRMATION_LINK.message,
        INVALID_CONFIRMATION_LINK.status,
      );
    }

    const { data, error } = await this.supabase.auth.getUser(
      confirmationLink.accessToken,
    );

    if (error || !data.user) {
      throw new ApiException(
        INVALID_CONFIRMATION_LINK.code,
        INVALID_CONFIRMATION_LINK.message,
        INVALID_CONFIRMATION_LINK.status,
      );
    }

    const emailConfirmedAt = data.user.email_confirmed_at;

    if (!emailConfirmedAt) {
      throw new ApiException(
        EMAIL_NOT_CONFIRMED.code,
        EMAIL_NOT_CONFIRMED.message,
        EMAIL_NOT_CONFIRMED.status,
      );
    }

    let user;

    try {
      user = await this.prisma.user.update({
        where: { supabaseAuthId: data.user.id },
        data: { emailConfirmedAt: new Date(emailConfirmedAt) },
      });
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new ApiException(
          USER_NOT_FOUND.code,
          USER_NOT_FOUND.message,
          USER_NOT_FOUND.status,
        );
      }

      throw error;
    }

    return this.toAuthUserResponse(user);
  }

  async login(input: LoginRequest): Promise<LoginResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      if (error.code === 'email_not_confirmed') {
        throw new ApiException(
          EMAIL_CONFIRMATION_REQUIRED.code,
          EMAIL_CONFIRMATION_REQUIRED.message,
          EMAIL_CONFIRMATION_REQUIRED.status,
        );
      }

      this.throwInvalidCredentials();
    }

    if (!data.session || !data.user) {
      this.throwInvalidCredentials();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseAuthId: data.user.id },
    });

    if (!user) {
      this.throwInvalidCredentials();
    }

    if (user.accessStatus !== 'ACTIVE') {
      throw new ApiException(
        ACCESS_PENDING.code,
        ACCESS_PENDING.message,
        ACCESS_PENDING.status,
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Date.now() + DEFAULT_SESSION_TTL_MS,
      user: this.toAuthUserResponse(user),
    };
  }

  private throwInvalidCredentials(): never {
    throw new ApiException(
      INVALID_CREDENTIALS.code,
      INVALID_CREDENTIALS.message,
      INVALID_CREDENTIALS.status,
    );
  }

  private toAuthUserResponse(user: User): AuthUserResponse {
    return authUserResponseSchema.parse({
      id: user.id,
      email: user.email,
      emailConfirmedAt: this.toIsoOrNull(user.emailConfirmedAt),
      accessStatus: user.accessStatus,
      interfaceLanguage: user.interfaceLanguage,
    });
  }

  private toIsoOrNull(value: Date | null | undefined): string | null {
    return value?.toISOString() ?? null;
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === code
    );
  }

  private targetsEmail(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    return Array.isArray(target) && target.includes('email');
  }
}

function parseConfirmationLink(
  url: string,
): { accessToken: string; type: string | null } | null {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const params = new URLSearchParams(parsed.hash.slice(1));
  const accessToken = params.get('access_token');

  if (!accessToken) {
    return null;
  }

  return { accessToken, type: params.get('type') };
}
