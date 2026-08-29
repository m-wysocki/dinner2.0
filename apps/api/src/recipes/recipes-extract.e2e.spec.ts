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
import { RecipeExtractionProvider } from '../ai/recipe-extraction.provider';

const USER_A = {
  token: 'user-a-token',
  supabaseAuthId: 'auth-user-a',
  ownerId: 'owner-a',
};

const getUser = vi.fn();
const userFindUnique = vi.fn();
const recipeFindFirst = vi.fn();
const recipeFindMany = vi.fn();
const recipeCreate = vi.fn();
const recipeUpdate = vi.fn();
const recipeDeleteMany = vi.fn();
const catalogFindMany = vi.fn();
const catalogCreate = vi.fn();
const extractRecipe = vi.fn();
const $transaction = vi.fn();

function installMocks() {
  getUser.mockImplementation(async (token: string) => {
    return token === USER_A.token
      ? { data: { user: { id: USER_A.supabaseAuthId } }, error: null }
      : {
          data: { user: null },
          error: { code: 'invalid_jwt', message: 'invalid' },
        };
  });

  userFindUnique.mockImplementation(
    async ({
      where,
      select,
    }: {
      where: { supabaseAuthId: string };
      select: Record<string, boolean>;
    }) => {
      if (where.supabaseAuthId !== USER_A.supabaseAuthId) {
        return null;
      }
      if ('accessStatus' in select) {
        return {
          accessStatus: 'ACTIVE',
          emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z'),
        };
      }
      return { id: USER_A.ownerId };
    },
  );

  catalogFindMany.mockImplementation(async () => [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      namePl: 'Pomidor',
      nameEn: 'Tomato',
      isSystem: true,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    },
    {
      id: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
      namePl: 'Mąka',
      nameEn: 'Flour',
      isSystem: true,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    },
  ]);
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function postExtract(body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/recipes/extract`, {
    method: 'POST',
    headers: {
      ...authHeaders(USER_A.token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

let app: INestApplication;
let baseUrl: string;

describe('recipe extraction endpoint (HTTP)', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SUPABASE_CLIENT)
      .useValue({ auth: { getUser } } as unknown as SupabaseClient)
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique: userFindUnique },
        recipe: {
          findFirst: recipeFindFirst,
          findMany: recipeFindMany,
          create: recipeCreate,
          update: recipeUpdate,
          deleteMany: recipeDeleteMany,
        },
        ingredientCatalogEntry: {
          findMany: catalogFindMany,
          create: catalogCreate,
        },
        $transaction,
      } as unknown as PrismaService)
      .overrideProvider(RecipeExtractionProvider)
      .useValue({
        extractRecipe,
      } as unknown as RecipeExtractionProvider)
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
    vi.clearAllMocks();
    installMocks();
  });

  it('returns a validated draft and never persists anything', async () => {
    extractRecipe.mockResolvedValue({
      description: 'Kremowa zupa pomidorowa.',
      ingredients: [
        { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
        { name: 'Mąka', quantity: '200', unit: 'g', note: null },
      ],
      preparationSteps: [{ text: 'Gotuj pomidory' }],
    });

    const response = await postExtract({
      title: 'Zupa pomidorowa',
      sourceText: 'Składniki: 2 pomidory, 200 g mąki. Gotuj pomidory.',
      servingCount: 4,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      title: 'Zupa pomidorowa',
      description: 'Kremowa zupa pomidorowa.',
      servingCount: 4,
      ingredients: [
        {
          name: 'Pomidor',
          catalogEntryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          customProposal: null,
          quantity: '2',
          unit: 'PCS',
          note: null,
          position: 0,
        },
        {
          name: 'Mąka',
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          customProposal: null,
          quantity: '200',
          unit: 'G',
          note: null,
          position: 1,
        },
      ],
      preparationSteps: [{ text: 'Gotuj pomidory', position: 0 }],
    });
    expect(recipeCreate).not.toHaveBeenCalled();
    expect(catalogCreate).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it('falls back to OTHER and preserves the original unit in the note', async () => {
    extractRecipe.mockResolvedValue({
      description: 'Drożdżowe ciasto.',
      ingredients: [
        { name: 'Mąka', quantity: null, unit: 'szklanka', note: null },
      ],
      preparationSteps: [],
    });

    const response = await postExtract({
      title: 'Ciasto',
      sourceText: 'Składniki: szklanka mąki.',
      servingCount: 8,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ingredients: [
        {
          name: 'Mąka',
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          customProposal: null,
          quantity: null,
          unit: 'OTHER',
          note: 'szklanka',
        },
      ],
    });
  });

  it('resolves matched identities and proposes custom identities for the rest', async () => {
    extractRecipe.mockResolvedValue({
      description: 'Zupa.',
      ingredients: [
        { name: 'Flour', quantity: '200', unit: 'G', note: null },
        { name: 'Szafran', quantity: null, unit: 'OTHER', note: null },
        { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
      ],
      preparationSteps: [],
    });

    const response = await postExtract({
      title: 'Zupa',
      sourceText: 'Flour, szafran, pomidor.',
      servingCount: 4,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      title: 'Zupa',
      description: 'Zupa.',
      servingCount: 4,
      ingredients: [
        {
          name: 'Flour',
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          customProposal: null,
          quantity: '200',
          unit: 'G',
          note: null,
          position: 0,
        },
        {
          name: 'Szafran',
          catalogEntryId: null,
          customProposal: { namePl: 'Szafran', nameEn: 'Szafran' },
          quantity: null,
          unit: 'OTHER',
          note: null,
          position: 1,
        },
        {
          name: 'Pomidor',
          catalogEntryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          customProposal: null,
          quantity: '2',
          unit: 'PCS',
          note: null,
          position: 2,
        },
      ],
      preparationSteps: [],
    });
    expect(recipeCreate).not.toHaveBeenCalled();
    expect(catalogCreate).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it('returns a loud, retryable error when the provider output fails validation', async () => {
    extractRecipe.mockResolvedValue({
      description: 'Zupa.',
      ingredients: [
        { name: 'Pomidor', quantity: 'abc', unit: 'PCS', note: null },
      ],
      preparationSteps: [],
    });

    const response = await postExtract({
      title: 'Zupa',
      sourceText: 'Pomidor.',
      servingCount: 4,
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'EXTRACTION_FAILED',
        message: 'Nie udało się wyodrębnić przepisu. Spróbuj ponownie.',
      },
    });
    expect(recipeCreate).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it('returns a loud, retryable error when the provider fails', async () => {
    extractRecipe.mockRejectedValue(new Error('provider boom'));

    const response = await postExtract({
      title: 'Zupa',
      sourceText: 'Pomidor.',
      servingCount: 4,
    });

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'EXTRACTION_FAILED',
        message: 'Nie udało się wyodrębnić przepisu. Spróbuj ponownie.',
      },
    });
    expect(JSON.stringify(body)).not.toContain('provider boom');
    expect(recipeCreate).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid request input with a validation error', async () => {
    const response = await postExtract({
      title: ' ',
      sourceText: 'Pomidor.',
      servingCount: 4,
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'title' })]),
    );
    expect(extractRecipe).not.toHaveBeenCalled();
  });

  it('requires authentication under the existing recipes guards', async () => {
    const response = await fetch(`${baseUrl}/recipes/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Zupa',
        sourceText: 'Pomidor.',
        servingCount: 4,
      }),
    });

    expect(response.status).toBe(401);
    expect(extractRecipe).not.toHaveBeenCalled();
  });
});
