import '../test-env';
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
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

const RECIPE_A_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SYSTEM_ENTRY_ID = '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a';
const OWNER_A_ENTRY_ID = '6e7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a';
const OWNER_B_ENTRY_ID = '6f7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a';

const USER_A = {
  token: 'user-a-token',
  supabaseAuthId: 'auth-user-a',
  ownerId: 'owner-a',
};
const USER_B = {
  token: 'user-b-token',
  supabaseAuthId: 'auth-user-b',
  ownerId: 'owner-b',
};

interface FakeIngredient {
  id: string;
  catalogEntryId: string;
  nameSnapshot: string;
  quantity: { toString(): string } | null;
  unit: string;
  note: string | null;
  position: number;
}

interface FakeRecipe {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  servingCount: number;
  createdAt: Date;
  updatedAt: Date;
  ingredients: FakeIngredient[];
}

interface FakeCatalogEntry {
  id: string;
  isActive: boolean;
  isSystem: boolean;
  ownerId: string | null;
}

let recipes: FakeRecipe[];
let catalogEntries: FakeCatalogEntry[];
let failNextCreate: boolean;

const getUser = vi.fn();
const userFindUnique = vi.fn();
const recipeFindFirst = vi.fn();
const recipeFindMany = vi.fn();
const recipeCreate = vi.fn();
const recipeUpdate = vi.fn();
const recipeDeleteMany = vi.fn();
const catalogFindFirst = vi.fn();
const $transaction = vi.fn();

function resetState() {
  recipes = [
    {
      id: RECIPE_A_ID,
      ownerId: USER_A.ownerId,
      title: 'Zupa pomidorowa',
      description: null,
      servingCount: 4,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-28T12:00:00.000Z'),
      ingredients: [
        {
          id: '5d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          catalogEntryId: SYSTEM_ENTRY_ID,
          nameSnapshot: 'Pomidor',
          quantity: { toString: () => '2' },
          unit: 'PCS',
          note: null,
          position: 0,
        },
      ],
    },
  ];
  catalogEntries = [
    { id: SYSTEM_ENTRY_ID, isActive: true, isSystem: true, ownerId: null },
    {
      id: OWNER_A_ENTRY_ID,
      isActive: true,
      isSystem: false,
      ownerId: USER_A.ownerId,
    },
    {
      id: OWNER_B_ENTRY_ID,
      isActive: true,
      isSystem: false,
      ownerId: USER_B.ownerId,
    },
  ];
  failNextCreate = false;
}

function ownerFor(supabaseAuthId: string): string {
  if (supabaseAuthId === USER_A.supabaseAuthId) {
    return USER_A.ownerId;
  }
  return USER_B.ownerId;
}

function installMocks() {
  getUser.mockImplementation(async (token: string) => {
    const user =
      token === USER_A.token ? USER_A : token === USER_B.token ? USER_B : null;
    return user
      ? { data: { user: { id: user.supabaseAuthId } }, error: null }
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
      const ownerId = ownerFor(where.supabaseAuthId);
      if ('accessStatus' in select) {
        return {
          accessStatus: 'ACTIVE',
          emailConfirmedAt: new Date('2026-08-27T12:00:00.000Z'),
        };
      }
      return { id: ownerId };
    },
  );

  recipeFindFirst.mockImplementation(
    async ({ where }: { where: { id: string; ownerId: string } }) => {
      const recipe = recipes.find(
        (candidate) =>
          candidate.id === where.id && candidate.ownerId === where.ownerId,
      );
      return recipe ?? null;
    },
  );

  recipeFindMany.mockImplementation(
    async ({ where }: { where: { ownerId: string } }) =>
      recipes
        .filter((recipe) => recipe.ownerId === where.ownerId)
        .map(
          ({ id, title, description, servingCount, createdAt, updatedAt }) => ({
            id,
            title,
            description,
            servingCount,
            createdAt,
            updatedAt,
          }),
        ),
  );

  recipeCreate.mockImplementation(
    async (input: { data: Record<string, unknown> }) => {
      const data = input.data as {
        ownerId: string;
        title: string;
        description: string | null;
        servingCount: number;
        ingredients?: { create?: Array<Record<string, unknown>> };
      };
      const recipe: FakeRecipe = {
        id: randomUUID(),
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        servingCount: data.servingCount,
        createdAt: new Date('2026-08-29T12:00:00.000Z'),
        updatedAt: new Date('2026-08-29T12:00:00.000Z'),
        ingredients: (data.ingredients?.create ?? []).map((ingredient) => ({
          id: randomUUID(),
          catalogEntryId: String(ingredient.catalogEntryId),
          nameSnapshot: String(ingredient.nameSnapshot),
          quantity: ingredient.quantity
            ? { toString: () => String(ingredient.quantity) }
            : null,
          unit: String(ingredient.unit),
          note: (ingredient.note as string | null | undefined) ?? null,
          position: Number(ingredient.position),
        })),
      };
      recipes.push(recipe);
      if (failNextCreate) {
        throw new Error('connection string postgresql://user:secret@db');
      }
      return recipe;
    },
  );

  recipeUpdate.mockImplementation(
    async (input: { where: { id: string }; data: Record<string, unknown> }) => {
      const index = recipes.findIndex((recipe) => recipe.id === input.where.id);
      const data = input.data as {
        title: string;
        description: string | null;
        servingCount: number;
        ingredients: { create?: Array<Record<string, unknown>> };
      };
      const existing = recipes[index];
      const updated: FakeRecipe = {
        ...existing,
        title: data.title,
        description: data.description,
        servingCount: data.servingCount,
        updatedAt: new Date('2026-08-29T12:00:00.000Z'),
        ingredients: (data.ingredients.create ?? []).map((ingredient) => ({
          id: randomUUID(),
          catalogEntryId: String(ingredient.catalogEntryId),
          nameSnapshot: String(ingredient.nameSnapshot),
          quantity: ingredient.quantity
            ? { toString: () => String(ingredient.quantity) }
            : null,
          unit: String(ingredient.unit),
          note: (ingredient.note as string | null | undefined) ?? null,
          position: Number(ingredient.position),
        })),
      };
      recipes[index] = updated;
      return updated;
    },
  );

  recipeDeleteMany.mockImplementation(
    async ({ where }: { where: { id: string; ownerId: string } }) => {
      const count = recipes.filter(
        (recipe) => recipe.id === where.id && recipe.ownerId === where.ownerId,
      ).length;
      recipes = recipes.filter(
        (recipe) =>
          !(recipe.id === where.id && recipe.ownerId === where.ownerId),
      );
      return { count };
    },
  );

  catalogFindFirst.mockImplementation(
    async ({
      where,
    }: {
      where: {
        id: string;
        isActive?: boolean;
        OR?: Array<{ ownerId?: string }>;
      };
    }) => {
      const entry = catalogEntries.find(
        (candidate) => candidate.id === where.id,
      );
      if (!entry || (where.isActive && !entry.isActive)) {
        return null;
      }
      const accessible =
        entry.isSystem || entry.ownerId === where.OR?.[1]?.ownerId;
      return accessible ? entry : null;
    },
  );

  $transaction.mockImplementation(
    async (callback: (client: unknown) => unknown) => {
      const snapshot = [...recipes];
      try {
        return await callback({
          recipe: {
            findFirst: recipeFindFirst,
            create: recipeCreate,
            update: recipeUpdate,
          },
          ingredientCatalogEntry: { findFirst: catalogFindFirst },
        });
      } catch (error) {
        recipes = snapshot;
        throw error;
      }
    },
  );
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function postRecipe(body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/recipes`, {
    method: 'POST',
    headers: {
      ...authHeaders(USER_A.token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function expectValidationError(response: Response, path: string) {
  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body.error.code).toBe('VALIDATION_ERROR');
  expect(body.error.message).toEqual(expect.any(String));
  expect(body.error.details).toEqual(
    expect.arrayContaining([expect.objectContaining({ path })]),
  );
}

let app: INestApplication;
let baseUrl: string;

describe('recipes API (HTTP)', () => {
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
        ingredientCatalogEntry: { findFirst: catalogFindFirst },
        $transaction,
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
    vi.clearAllMocks();
    resetState();
    installMocks();
  });

  describe('ownership isolation', () => {
    it('returns the owner recipe details to the owner', async () => {
      const response = await fetch(`${baseUrl}/recipes/${RECIPE_A_ID}`, {
        headers: authHeaders(USER_A.token),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: RECIPE_A_ID,
        title: 'Zupa pomidorowa',
        ingredients: [{ name: 'Pomidor', quantity: '2' }],
      });
    });

    it('hides another user recipes from the collection', async () => {
      const response = await fetch(`${baseUrl}/recipes`, {
        headers: authHeaders(USER_B.token),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([]);
    });

    it('does not let another user read the recipe', async () => {
      const response = await fetch(`${baseUrl}/recipes/${RECIPE_A_ID}`, {
        headers: authHeaders(USER_B.token),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: 'Nie znaleziono przepisu.',
        },
      });
    });

    it('does not let another user update the recipe', async () => {
      const response = await fetch(`${baseUrl}/recipes/${RECIPE_A_ID}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(USER_B.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Podmieniony',
          servingCount: 2,
          ingredients: [],
        }),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: 'Nie znaleziono przepisu.',
        },
      });
      expect(recipeUpdate).not.toHaveBeenCalled();
    });

    it('does not let another user delete the recipe', async () => {
      const response = await fetch(`${baseUrl}/recipes/${RECIPE_A_ID}`, {
        method: 'DELETE',
        headers: authHeaders(USER_B.token),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: 'Nie znaleziono przepisu.',
        },
      });
      expect(
        recipes.some(
          (recipe) =>
            recipe.id === RECIPE_A_ID && recipe.ownerId === USER_A.ownerId,
        ),
      ).toBe(true);
    });

    it('lets the owner delete their recipe', async () => {
      const response = await fetch(`${baseUrl}/recipes/${RECIPE_A_ID}`, {
        method: 'DELETE',
        headers: authHeaders(USER_A.token),
      });

      expect(response.status).toBe(204);
      expect(recipes.some((recipe) => recipe.id === RECIPE_A_ID)).toBe(false);
    });

    it('does not let a user create a recipe with another user custom ingredient', async () => {
      const response = await postRecipe({
        title: 'Cudzy przepis',
        servingCount: 2,
        ingredients: [
          {
            catalogEntryId: OWNER_B_ENTRY_ID,
            name: 'Sekret',
            quantity: '1',
            unit: 'PCS',
            position: 0,
          },
        ],
      });

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INGREDIENT_NOT_ACCESSIBLE',
          message: 'Wybrany składnik nie jest dostępny.',
        },
      });
      expect(recipeCreate).not.toHaveBeenCalled();
      expect(recipes).toHaveLength(1);
    });
  });

  describe('validation', () => {
    it('rejects an empty title', async () => {
      await expectValidationError(
        await postRecipe({ title: '   ', servingCount: 4 }),
        'title',
      );
    });

    it('rejects a non-positive serving count', async () => {
      await expectValidationError(
        await postRecipe({ title: 'Zupa', servingCount: 0 }),
        'servingCount',
      );
    });

    it('rejects a non-canonical ingredient unit', async () => {
      await expectValidationError(
        await postRecipe({
          title: 'Zupa',
          servingCount: 4,
          ingredients: [
            {
              catalogEntryId: SYSTEM_ENTRY_ID,
              name: 'Pomidor',
              quantity: '2',
              unit: 'gramy',
              position: 0,
            },
          ],
        }),
        'ingredients.0.unit',
      );
    });

    it('rejects a malformed ingredient quantity', async () => {
      await expectValidationError(
        await postRecipe({
          title: 'Zupa',
          servingCount: 4,
          ingredients: [
            {
              catalogEntryId: SYSTEM_ENTRY_ID,
              name: 'Pomidor',
              quantity: 'abc',
              unit: 'PCS',
              position: 0,
            },
          ],
        }),
        'ingredients.0.quantity',
      );
    });

    it('rejects a zero ingredient quantity', async () => {
      await expectValidationError(
        await postRecipe({
          title: 'Zupa',
          servingCount: 4,
          ingredients: [
            {
              catalogEntryId: SYSTEM_ENTRY_ID,
              name: 'Pomidor',
              quantity: '0',
              unit: 'PCS',
              position: 0,
            },
          ],
        }),
        'ingredients.0.quantity',
      );
    });

    it('rejects ingredients with non-consecutive positions', async () => {
      await expectValidationError(
        await postRecipe({
          title: 'Zupa',
          servingCount: 4,
          ingredients: [
            {
              catalogEntryId: SYSTEM_ENTRY_ID,
              name: 'Pomidor',
              quantity: '2',
              unit: 'PCS',
              position: 0,
            },
            {
              catalogEntryId: SYSTEM_ENTRY_ID,
              name: 'Cebula',
              quantity: '1',
              unit: 'PCS',
              position: 0,
            },
          ],
        }),
        'ingredients',
      );
    });

    it('rejects invalid update input before touching the recipe', async () => {
      const response = await fetch(`${baseUrl}/recipes/${RECIPE_A_ID}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(USER_A.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Zupa',
          servingCount: 0,
          ingredients: [],
        }),
      });

      await expectValidationError(response, 'servingCount');
      expect(recipeUpdate).not.toHaveBeenCalled();
    });
  });

  describe('atomic persistence', () => {
    it('creates a recipe with all its parts in one atomic write', async () => {
      const response = await postRecipe({
        title: 'Naleśniki',
        servingCount: 4,
        ingredients: [
          {
            catalogEntryId: SYSTEM_ENTRY_ID,
            name: 'Mąka',
            quantity: '200',
            unit: 'G',
            position: 0,
          },
        ],
      });

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toMatchObject({
        title: 'Naleśniki',
        ingredients: [{ name: 'Mąka', quantity: '200' }],
      });
      expect($transaction).toHaveBeenCalled();
    });

    it('stores the pasted source text without returning it', async () => {
      const response = await postRecipe({
        title: 'Zupa',
        servingCount: 4,
        sourceText: 'Składniki: pomidor.',
      });

      expect(response.status).toBe(201);
      expect(recipeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceText: 'Składniki: pomidor.',
          }),
        }),
      );
      const body = await response.json();
      expect(body).toMatchObject({ title: 'Zupa' });
      expect(JSON.stringify(body)).not.toContain('sourceText');
    });

    it('leaves no partial recipe when the write fails mid-transaction', async () => {
      failNextCreate = true;

      const response = await postRecipe({
        title: 'Naleśniki',
        servingCount: 4,
        ingredients: [
          {
            catalogEntryId: SYSTEM_ENTRY_ID,
            name: 'Mąka',
            quantity: '200',
            unit: 'G',
            position: 0,
          },
        ],
      });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Wystąpił nieoczekiwany błąd serwera.',
        },
      });
      expect(JSON.stringify(body)).not.toContain('secret');
      expect(JSON.stringify(body)).not.toContain('connection string');
      expect(recipes).toHaveLength(1);
      expect(recipes[0].id).toBe(RECIPE_A_ID);
    });

    it('returns the agreed not-found shape for a malformed recipe id', async () => {
      const response = await fetch(`${baseUrl}/recipes/not-a-uuid`, {
        headers: authHeaders(USER_A.token),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: 'Nie znaleziono przepisu.',
        },
      });
      expect(recipeFindFirst).not.toHaveBeenCalled();
    });
  });
});
