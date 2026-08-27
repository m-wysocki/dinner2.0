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
const userCreate = vi.fn();

describe('POST /api/v1/auth/register (HTTP)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SUPABASE_CLIENT)
      .useValue({ auth: { signUp } } as unknown as SupabaseClient)
      .overrideProvider(PrismaService)
      .useValue({ user: { create: userCreate } } as unknown as PrismaService)
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
    userCreate.mockReset();
  });

  it('creates a pending application user and returns its representation', async () => {
    signUp.mockResolvedValue({
      data: { user: { id: 'auth-user-id' } },
      error: null,
    });
    userCreate.mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      email: 'user@example.com',
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
      accessStatus: 'PENDING',
      interfaceLanguage: 'pl',
    });

    expect(signUp).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'correct horse',
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
