import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma.service';

type SignUpMock = ReturnType<typeof vi.fn>;

function setup() {
  const supabase = {
    auth: { signUp: vi.fn() },
  } as unknown as SupabaseClient;

  const prisma = {
    user: { create: vi.fn() },
  } as unknown as PrismaService;

  const service = new AuthService(supabase, prisma);

  return { supabase, prisma, service };
}

const validInput = {
  email: 'user@example.com',
  password: 'correct horse',
};

describe('AuthService', () => {
  it('registers with Supabase and creates a pending application user', async () => {
    const { supabase, prisma, service } = setup();

    const signUp = supabase.auth.signUp as SignUpMock;
    signUp.mockResolvedValue({
      data: { user: { id: 'auth-user-id' } },
      error: null,
    });

    (prisma.user.create as SignUpMock).mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: validInput.email,
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    await expect(service.register(validInput)).resolves.toEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: validInput.email,
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    expect(signUp).toHaveBeenCalledWith({
      email: validInput.email,
      password: validInput.password,
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

    (supabase.auth.signUp as SignUpMock).mockResolvedValue({
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

    (supabase.auth.signUp as SignUpMock).mockResolvedValue({
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

    (supabase.auth.signUp as SignUpMock).mockResolvedValue({
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

    (supabase.auth.signUp as SignUpMock).mockResolvedValue({
      data: { user: { id: 'auth-user-id' } },
      error: null,
    });

    (prisma.user.create as SignUpMock).mockRejectedValue({
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

    (supabase.auth.signUp as SignUpMock).mockResolvedValue({
      data: { user: { id: 'auth-user-id' } },
      error: null,
    });

    const collision = { code: 'P2002', meta: { target: ['supabaseAuthId'] } };
    (prisma.user.create as SignUpMock).mockRejectedValue(collision);

    await expect(service.register(validInput)).rejects.toBe(collision);
  });
});
