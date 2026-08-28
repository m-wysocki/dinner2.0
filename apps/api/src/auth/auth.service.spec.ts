import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma.service';

type Mock = ReturnType<typeof vi.fn>;

function setup() {
  const supabase = {
    auth: {
      signUp: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  } as unknown as SupabaseClient;

  const prisma = {
    user: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  } as unknown as PrismaService;

  const service = new AuthService(supabase, prisma);

  return { supabase, prisma, service };
}

const validInput = {
  email: 'user@example.com',
  password: 'correct horse',
};

const pendingUser = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: validInput.email,
  emailConfirmedAt: null,
  accessStatus: 'PENDING',
  interfaceLanguage: 'pl',
};

describe('AuthService', () => {
  describe('register', () => {
    it('registers with Supabase and creates a pending application user', async () => {
      const { supabase, prisma, service } = setup();

      const signUp = supabase.auth.signUp as Mock;
      signUp.mockResolvedValue({
        data: { user: { id: 'auth-user-id' } },
        error: null,
      });

      (prisma.user.create as Mock).mockResolvedValue(pendingUser);

      await expect(service.register(validInput)).resolves.toEqual({
        ...pendingUser,
      });

      expect(signUp).toHaveBeenCalledWith({
        email: validInput.email,
        password: validInput.password,
        options: { emailRedirectTo: 'dinner2://confirm' },
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          supabaseAuthId: 'auth-user-id',
          email: validInput.email,
        },
      });
    });

    it('rejects registration when the email is already registered', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: null },
        error: {
          code: 'user_already_exists',
          message: 'User already registered',
        },
      });

      await expect(service.register(validInput)).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_REGISTERED',
        status: 409,
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('rejects registration when Supabase returns an unexpected error', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: null },
        error: {
          code: 'over_email_send_rate_limit',
          message: 'Too many requests',
        },
      });

      await expect(service.register(validInput)).rejects.toMatchObject({
        code: 'REGISTRATION_FAILED',
        status: 422,
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('treats a missing user with no error as an existing unconfirmed email', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.register(validInput)).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_REGISTERED',
        status: 409,
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('maps a unique constraint violation on the email column', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: { id: 'auth-user-id' } },
        error: null,
      });

      (prisma.user.create as Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.register(validInput)).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_REGISTERED',
        status: 409,
      });
    });

    it('rethrows a unique violation that is not on the email column', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signUp as Mock).mockResolvedValue({
        data: { user: { id: 'auth-user-id' } },
        error: null,
      });

      const collision = { code: 'P2002', meta: { target: ['supabaseAuthId'] } };
      (prisma.user.create as Mock).mockRejectedValue(collision);

      await expect(service.register(validInput)).rejects.toBe(collision);
    });
  });

  describe('confirmEmail', () => {
    const url =
      'dinner2://confirm#access_token=header.payload.signature&refresh_token=refresh&type=signup';

    it('confirms the email and records the Supabase-reported confirmation time', async () => {
      const { supabase, prisma, service } = setup();

      const confirmedAt = '2026-08-27T12:00:00.000Z';

      (supabase.auth.getUser as Mock).mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-id',
            email_confirmed_at: confirmedAt,
          },
        },
        error: null,
      });

      (prisma.user.update as Mock).mockResolvedValue({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: validInput.email,
        emailConfirmedAt: new Date(confirmedAt),
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      await expect(service.confirmEmail({ url })).resolves.toEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: validInput.email,
        emailConfirmedAt: confirmedAt,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      expect(supabase.auth.getUser).toHaveBeenCalledWith(
        'header.payload.signature',
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { supabaseAuthId: 'auth-user-id' },
        data: { emailConfirmedAt: new Date(confirmedAt) },
      });
    });

    it('rejects a link without an access token', async () => {
      const { supabase, prisma, service } = setup();

      await expect(
        service.confirmEmail({ url: 'dinner2://confirm' }),
      ).rejects.toMatchObject({
        code: 'INVALID_CONFIRMATION_LINK',
        status: 400,
      });

      expect(supabase.auth.getUser).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a link that is not a confirmation link', async () => {
      const { supabase, prisma, service } = setup();

      await expect(
        service.confirmEmail({
          url: 'dinner2://confirm#access_token=header.payload.signature&type=magiclink',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_CONFIRMATION_LINK',
        status: 400,
      });

      await expect(
        service.confirmEmail({
          url: 'dinner2://confirm#access_token=header.payload.signature',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_CONFIRMATION_LINK',
        status: 400,
      });

      expect(supabase.auth.getUser).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a link with an invalid or expired access token', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.getUser as Mock).mockResolvedValue({
        data: { user: null },
        error: { code: 'invalid_jwt', message: 'Invalid JWT' },
      });

      await expect(service.confirmEmail({ url })).rejects.toMatchObject({
        code: 'INVALID_CONFIRMATION_LINK',
        status: 400,
      });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects an unconfirmed Supabase user', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.getUser as Mock).mockResolvedValue({
        data: {
          user: { id: 'auth-user-id', email_confirmed_at: null },
        },
        error: null,
      });

      await expect(service.confirmEmail({ url })).rejects.toMatchObject({
        code: 'EMAIL_NOT_CONFIRMED',
        status: 422,
      });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('maps a missing application user to a safe 404', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.getUser as Mock).mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-id',
            email_confirmed_at: '2026-08-27T12:00:00.000Z',
          },
        },
        error: null,
      });

      (prisma.user.update as Mock).mockRejectedValue({ code: 'P2025' });

      await expect(service.confirmEmail({ url })).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        status: 404,
      });
    });

    it('rethrows a non-record-not-found update failure', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.getUser as Mock).mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-id',
            email_confirmed_at: '2026-08-27T12:00:00.000Z',
          },
        },
        error: null,
      });

      const failure = new Error('database down');
      (prisma.user.update as Mock).mockRejectedValue(failure);

      await expect(service.confirmEmail({ url })).rejects.toBe(failure);
    });
  });

  describe('login', () => {
    const session = {
      access_token: 'header.payload.signature',
      refresh_token: 'refresh-token',
      expires_at: 1785302400,
    };

    const activeUser = {
      ...pendingUser,
      accessStatus: 'ACTIVE',
      emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z'),
    };

    it('establishes a session and returns it with the application user', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
        data: {
          user: { id: 'auth-user-id' },
          session,
        },
        error: null,
      });
      (prisma.user.findUnique as Mock).mockResolvedValue(activeUser);

      await expect(service.login(validInput)).resolves.toEqual({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
        user: {
          id: activeUser.id,
          email: activeUser.email,
          emailConfirmedAt: activeUser.emailConfirmedAt.toISOString(),
          accessStatus: 'ACTIVE',
          interfaceLanguage: 'pl',
        },
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validInput.email,
        password: validInput.password,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { supabaseAuthId: 'auth-user-id' },
      });
    });

    it('falls back to a computed expiry when Supabase omits it', async () => {
      const { supabase, prisma, service } = setup();

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'));

      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
        data: {
          user: { id: 'auth-user-id' },
          session: { ...session, expires_at: undefined },
        },
        error: null,
      });
      (prisma.user.findUnique as Mock).mockResolvedValue(activeUser);

      const result = await service.login(validInput);

      vi.useRealTimers();

      expect(result.expiresAt).toBe(
        new Date('2026-08-28T13:00:00.000Z').getTime(),
      );
    });

    it('rejects a pending account until an administrator activates it', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
        data: { user: { id: 'auth-user-id' }, session },
        error: null,
      });
      (prisma.user.findUnique as Mock).mockResolvedValue(pendingUser);

      await expect(service.login(validInput)).rejects.toMatchObject({
        code: 'ACCESS_PENDING',
        status: 403,
      });
    });

    it('rejects an unconfirmed account with an actionable message', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
      });

      await expect(service.login(validInput)).rejects.toMatchObject({
        code: 'EMAIL_NOT_CONFIRMED',
        status: 422,
      });

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects invalid credentials with a safe 401', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'invalid_credentials',
          message: 'Invalid login credentials',
        },
      });

      await expect(service.login(validInput)).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a missing application user record', async () => {
      const { supabase, prisma, service } = setup();

      (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
        data: { user: { id: 'auth-user-id' }, session },
        error: null,
      });
      (prisma.user.findUnique as Mock).mockResolvedValue(null);

      await expect(service.login(validInput)).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });
    });
  });
});
