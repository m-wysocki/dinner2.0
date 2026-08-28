import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard';

function setup() {
  const getUser = vi.fn();
  const guard = new AuthGuard({
    auth: { getUser },
  } as unknown as SupabaseClient);
  const request: AuthenticatedRequest = { headers: {} };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;

  return { getUser, guard, request, context };
}

describe('AuthGuard', () => {
  it('rejects requests without a bearer token', async () => {
    const { getUser, guard, context } = setup();

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
    expect(getUser).not.toHaveBeenCalled();
  });

  it('verifies the bearer token and stores only the verified identity', async () => {
    const { getUser, guard, request, context } = setup();
    request.headers.authorization = 'Bearer access-token';
    getUser.mockResolvedValue({
      data: { user: { id: 'auth-user-id' } },
      error: null,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(getUser).toHaveBeenCalledWith('access-token');
    expect(request.supabaseAuthId).toBe('auth-user-id');
  });

  it('rejects invalid or expired tokens', async () => {
    const { getUser, guard, request, context } = setup();
    request.headers.authorization = 'Bearer expired-token';
    getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'invalid_jwt' },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });
});
