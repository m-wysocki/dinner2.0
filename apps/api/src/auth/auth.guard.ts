import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiException } from '../common/api-error';
import { SUPABASE_CLIENT } from '../supabase';

export interface AuthenticatedRequest {
  headers: { authorization?: string };
  supabaseAuthId?: string;
}

const INVALID_AUTHENTICATION = {
  code: 'INVALID_CREDENTIALS' as const,
  message: 'Sesja jest nieprawidłowa lub wygasła.',
  status: 401,
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = extractBearerToken(request.headers.authorization);

    if (!accessToken) {
      this.throwInvalidAuthentication();
    }

    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      this.throwInvalidAuthentication();
    }

    request.supabaseAuthId = data.user.id;
    return true;
  }

  private throwInvalidAuthentication(): never {
    throw new ApiException(
      INVALID_AUTHENTICATION.code,
      INVALID_AUTHENTICATION.message,
      INVALID_AUTHENTICATION.status,
    );
  }
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  return match?.[1] ?? null;
}
