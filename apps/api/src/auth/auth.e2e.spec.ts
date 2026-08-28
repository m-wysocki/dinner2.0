import '../test-env';
import 'reflect-metadata';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma.service';
import { SUPABASE_CLIENT } from '../supabase';

const signUp = vi.fn();
const getUser = vi.fn();
const signInWithPassword = vi.fn();
const userCreate = vi.fn();
const userUpdate = vi.fn();
const userFindUnique = vi.fn();

describe('POST /api/v1/auth (HTTP)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SUPABASE_CLIENT)
      .useValue({
        auth: { signUp, getUser, signInWithPassword },
      } as unknown as SupabaseClient)
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          create: userCreate,
          update: userUpdate,
          findUnique: userFindUnique,
        },
      } as unknown as PrismaService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${(address as { port: number }).port}/api/v1`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    signUp.mockReset();
    getUser.mockReset();
    signInWithPassword.mockReset();
    userCreate.mockReset();
    userUpdate.mockReset();
    userFindUnique.mockReset();
  });

  describe('/auth/register', () => {
    it('creates a pending application user and returns its representation', async () => {
      signUp.mockResolvedValue({
        data: { user: { id: 'auth-user-id' } },
        error: null,
      });
      userCreate.mockResolvedValue({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'User@Example.com',
          password: 'correct horse',
        }),
      });

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      expect(signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'correct horse',
        options: { emailRedirectTo: 'dinner2://confirm' },
      });
      expect(userCreate).toHaveBeenCalledWith({
        data: { supabaseAuthId: 'auth-user-id', email: 'user@example.com' },
      });
    });

    it('rejects invalid registration data with the predictable error shape', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'short',
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();

      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toEqual(expect.any(String));
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'email' }),
          expect.objectContaining({ path: 'password' }),
        ]),
      );

      expect(signUp).not.toHaveBeenCalled();
    });

    it('rejects an already registered email with a safe 409', async () => {
      signUp.mockResolvedValue({
        data: { user: null },
        error: {
          code: 'user_already_exists',
          message: 'User already registered',
        },
      });

      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'correct horse',
        }),
      });

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Konto z tym adresem e-mail już istnieje.',
        },
      });
    });
  });

  describe('/auth/confirm-email', () => {
    it('confirms the email and returns the confirmed application user', async () => {
      getUser.mockResolvedValue({
        data: {
          user: {
            id: 'auth-user-id',
            email_confirmed_at: '2026-08-27T12:00:00.000Z',
          },
        },
        error: null,
      });
      userUpdate.mockResolvedValue({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z'),
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      const response = await fetch(`${baseUrl}/auth/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'dinner2://confirm#access_token=header.payload.signature&refresh_token=refresh&type=signup',
        }),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: '2026-08-27T12:00:00.000Z',
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      expect(getUser).toHaveBeenCalledWith('header.payload.signature');
      expect(userUpdate).toHaveBeenCalledWith({
        where: { supabaseAuthId: 'auth-user-id' },
        data: { emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z') },
      });
    });

    it('rejects a confirmation link without an access token', async () => {
      const response = await fetch(`${baseUrl}/auth/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'dinner2://confirm' }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INVALID_CONFIRMATION_LINK',
          message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
        },
      });

      expect(getUser).not.toHaveBeenCalled();
      expect(userUpdate).not.toHaveBeenCalled();
    });

    it('rejects a link that is not a confirmation link', async () => {
      const response = await fetch(`${baseUrl}/auth/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'dinner2://confirm#access_token=header.payload.signature&type=magiclink',
        }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INVALID_CONFIRMATION_LINK',
          message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
        },
      });

      expect(getUser).not.toHaveBeenCalled();
      expect(userUpdate).not.toHaveBeenCalled();
    });

    it('rejects an invalid or expired access token', async () => {
      getUser.mockResolvedValue({
        data: { user: null },
        error: { code: 'invalid_jwt', message: 'Invalid JWT' },
      });

      const response = await fetch(`${baseUrl}/auth/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'dinner2://confirm#access_token=expired.payload.signature&type=signup',
        }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INVALID_CONFIRMATION_LINK',
          message: 'Link potwierdzający jest nieprawidłowy lub wygasł.',
        },
      });
    });
  });

  describe('/auth/login', () => {
    const session = {
      access_token: 'header.payload.signature',
      refresh_token: 'refresh-token',
      expires_at: 1785302400,
    };

    it('establishes an authenticated session for valid credentials', async () => {
      signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'auth-user-id' },
          session,
        },
        error: null,
      });
      userFindUnique.mockResolvedValue({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z'),
        accessStatus: 'ACTIVE',
        interfaceLanguage: 'pl',
      });

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'User@Example.com',
          password: 'correct horse',
        }),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          emailConfirmedAt: '2026-08-27T12:00:00.000Z',
          accessStatus: 'ACTIVE',
          interfaceLanguage: 'pl',
        },
      });

      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'correct horse',
      });
      expect(userFindUnique).toHaveBeenCalledWith({
        where: { supabaseAuthId: 'auth-user-id' },
      });
    });

    it('rejects invalid credentials with a safe 401', async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'invalid_credentials',
          message: 'Invalid login credentials',
        },
      });

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'wrong password',
        }),
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Nieprawidłowy adres e-mail lub hasło.',
        },
      });

      expect(userFindUnique).not.toHaveBeenCalled();
    });

    it('rejects a pending account until an administrator activates it', async () => {
      signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'auth-user-id' },
          session,
        },
        error: null,
      });
      userFindUnique.mockResolvedValue({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z'),
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'correct horse',
        }),
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'ACCESS_PENDING',
          message: 'Konto oczekuje na akceptację administratora.',
        },
      });
    });

    it('tells unconfirmed accounts to confirm their email first', async () => {
      signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
      });

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'correct horse',
        }),
      });

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'EMAIL_NOT_CONFIRMED',
          message:
            'Potwierdź najpierw adres e-mail. Sprawdź link potwierdzający wysłany w wiadomości od nas.',
        },
      });

      expect(userFindUnique).not.toHaveBeenCalled();
    });

    it('rejects malformed login data with the predictable error shape', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();

      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'email' }),
          expect.objectContaining({ path: 'password' }),
        ]),
      );

      expect(signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('/auth/me', () => {
    it('returns the application user for the verified bearer token', async () => {
      getUser.mockResolvedValue({
        data: { user: { id: 'auth-user-id' } },
        error: null,
      });
      userFindUnique.mockResolvedValue({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });

      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer verified-token' },
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        emailConfirmedAt: null,
        accessStatus: 'PENDING',
        interfaceLanguage: 'pl',
      });
      expect(getUser).toHaveBeenCalledWith('verified-token');
      expect(userFindUnique).toHaveBeenCalledWith({
        where: { supabaseAuthId: 'auth-user-id' },
      });
    });

    it('rejects requests without a valid session', async () => {
      const response = await fetch(`${baseUrl}/auth/me`);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Sesja jest nieprawidłowa lub wygasła.',
        },
      });
      expect(getUser).not.toHaveBeenCalled();
      expect(userFindUnique).not.toHaveBeenCalled();
    });

    it('rejects an invalid bearer token before querying application data', async () => {
      getUser.mockResolvedValue({
        data: { user: null },
        error: { code: 'invalid_jwt' },
      });

      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      expect(response.status).toBe(401);
      expect(userFindUnique).not.toHaveBeenCalled();
    });
  });
});
