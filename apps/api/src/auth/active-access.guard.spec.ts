import { describe, expect, it, vi } from 'vitest';
import { ActiveAccessGuard } from './active-access.guard';

function setup(
  accessStatus: 'PENDING' | 'ACTIVE' | null,
  emailConfirmedAt: Date | null = new Date(),
) {
  const findUnique = vi
    .fn()
    .mockResolvedValue(
      accessStatus ? { accessStatus, emailConfirmedAt } : null,
    );
  const guard = new ActiveAccessGuard({ user: { findUnique } } as never);
  const request = { headers: {}, supabaseAuthId: 'auth-user-id' };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;

  return { findUnique, guard, context };
}

describe('ActiveAccessGuard', () => {
  it('allows active users', async () => {
    const { findUnique, guard, context } = setup('ACTIVE');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { supabaseAuthId: 'auth-user-id' },
      select: { accessStatus: true, emailConfirmedAt: true },
    });
  });

  it('blocks pending users from private data', async () => {
    const { guard, context } = setup('PENDING');

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'ACCESS_PENDING',
      status: 403,
    });
  });

  it('blocks requests without an application user', async () => {
    const { guard, context } = setup(null);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'ACCESS_PENDING',
      status: 403,
    });
  });

  it('blocks active users whose email is not confirmed', async () => {
    const { guard, context } = setup('ACTIVE', null);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      code: 'ACCESS_PENDING',
      status: 403,
    });
  });
});
