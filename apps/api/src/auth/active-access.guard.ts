import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ApiException } from '../common/api-error';
import { PrismaService } from '../prisma.service';
import type { AuthenticatedRequest } from './auth.guard';

const ACCESS_PENDING = {
  code: 'ACCESS_PENDING' as const,
  message: 'Konto oczekuje na aktywację administratora.',
  status: 403,
};

@Injectable()
export class ActiveAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.supabaseAuthId) {
      throw new ApiException(
        'INVALID_CREDENTIALS',
        'Sesja jest nieprawidłowa lub wygasła.',
        401,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseAuthId: request.supabaseAuthId },
      select: { accessStatus: true },
    });

    if (!user || user.accessStatus !== 'ACTIVE') {
      throw new ApiException(
        ACCESS_PENDING.code,
        ACCESS_PENDING.message,
        ACCESS_PENDING.status,
      );
    }

    return true;
  }
}
