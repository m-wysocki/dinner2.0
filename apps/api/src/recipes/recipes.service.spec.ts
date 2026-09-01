import { describe, expect, it, vi } from 'vitest';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  it('lists only the owner recipes in newest-first order', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'owner-id' });
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Nowsza zupa',
        description: null,
        servingCount: 4,
        createdAt: new Date('2026-08-29T12:00:00.000Z'),
        updatedAt: new Date('2026-08-29T12:00:00.000Z'),
      },
    ]);
    const service = new RecipesService({
      user: { findUnique },
      recipe: { findMany },
    } as never);

    await expect(service.list('supabase-user-id')).resolves.toMatchObject([
      { title: 'Nowsza zupa' },
    ]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { supabaseAuthId: 'supabase-user-id' },
      select: { id: true },
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { ownerId: 'owner-id' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  });

  it('creates a recipe for the authenticated application user', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'owner-id' });
    const create = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Zupa',
      description: null,
      servingCount: 4,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-28T12:00:00.000Z'),
      ingredients: [],
    });
    const transaction = vi.fn((callback) => callback({ recipe: { create } }));
    const service = new RecipesService({
      user: { findUnique },
      $transaction: transaction,
    } as never);

    await expect(
      service.create('supabase-user-id', {
        title: 'Zupa',
        servingCount: 4,
        sourceText: 'Składniki: pomidor.',
      }),
    ).resolves.toMatchObject({ title: 'Zupa', servingCount: 4 });
    expect(findUnique).toHaveBeenCalledWith({
      where: { supabaseAuthId: 'supabase-user-id' },
      select: { id: true },
    });
    expect(transaction).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: 'owner-id',
        title: 'Zupa',
        description: null,
        servingCount: 4,
        sourceText: 'Składniki: pomidor.',
        ingredients: { create: [] },
      }),
      include: { ingredients: true },
    });
  });

  it('stores no source text when a recipe is created without it', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Zupa',
      description: null,
      servingCount: 4,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-28T12:00:00.000Z'),
      ingredients: [],
    });
    const transaction = vi.fn((callback) => callback({ recipe: { create } }));
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      $transaction: transaction,
    } as never);

    await service.create('supabase-user-id', {
      title: 'Zupa',
      servingCount: 4,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sourceText: null }),
      }),
    );
  });

  it('returns complete details only when the recipe belongs to the owner', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'owner-id' });
    const findFirst = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Zupa',
      description: 'Domowa',
      servingCount: 4,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-28T12:00:00.000Z'),
      ingredients: [
        {
          id: '5d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          nameSnapshot: 'Pomidor',
          quantity: { toString: () => '2' },
          unit: 'PCS',
          note: null,
          position: 0,
        },
      ],
    });
    const service = new RecipesService({
      user: { findUnique },
      recipe: { findFirst },
    } as never);

    await expect(
      service.get('supabase-user-id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    ).resolves.toMatchObject({
      title: 'Zupa',
      ingredients: [{ name: 'Pomidor', quantity: '2', unit: 'PCS' }],
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ownerId: 'owner-id',
      },
      include: {
        ingredients: { orderBy: { position: 'asc' } },
      },
    });
  });

  it('uses the same not-found response for an inaccessible recipe', async () => {
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      recipe: { findFirst: vi.fn().mockResolvedValue(null) },
    } as never);

    await expect(
      service.get('supabase-user-id', 'recipe-id'),
    ).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
      status: 404,
    });
  });

  it('uses the same not-found response for a malformed recipe id', async () => {
    const findFirst = vi.fn();
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      recipe: { findFirst },
    } as never);

    await expect(
      service.get('supabase-user-id', 'not-a-uuid'),
    ).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
      status: 404,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('updates a recipe owned by the authenticated user atomically', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'owner-id' });
    const update = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Zupa ulepszona',
      description: null,
      servingCount: 6,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-29T12:00:00.000Z'),
      ingredients: [
        {
          id: '5d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          nameSnapshot: 'Pomidor',
          quantity: { toString: () => '3' },
          unit: 'PCS',
          note: null,
          position: 0,
        },
      ],
    });
    const findFirst = vi.fn().mockResolvedValue({ id: 'recipe-id' });
    const transaction = vi.fn((callback) =>
      callback({
        recipe: { findFirst, update },
        ingredientCatalogEntry: {
          findFirst: vi.fn().mockResolvedValue({ id: 'catalog-entry' }),
        },
      }),
    );
    const service = new RecipesService({
      user: { findUnique },
      $transaction: transaction,
    } as never);

    await expect(
      service.update(
        'supabase-user-id',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        {
          title: 'Zupa ulepszona',
          servingCount: 6,
          ingredients: [
            {
              catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
              name: 'Pomidor',
              quantity: '3',
              unit: 'PCS',
              position: 0,
            },
          ],
        },
      ),
    ).resolves.toMatchObject({
      title: 'Zupa ulepszona',
      servingCount: 6,
      ingredients: [{ name: 'Pomidor', quantity: '3' }],
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ownerId: 'owner-id',
      },
      select: { id: true },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      data: {
        title: 'Zupa ulepszona',
        description: null,
        servingCount: 6,
        ingredients: {
          deleteMany: {},
          create: [
            {
              catalogEntryId: '6d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
              nameSnapshot: 'Pomidor',
              quantity: '3',
              unit: 'PCS',
              note: null,
              position: 0,
              identityConfirmed: true,
            },
          ],
        },
      },
      include: { ingredients: true },
    });
  });

  it('rejects updating a recipe that is not owned by the user', async () => {
    const transaction = vi.fn((callback) =>
      callback({
        recipe: { findFirst: vi.fn().mockResolvedValue(null) },
        ingredientCatalogEntry: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      }),
    );
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      $transaction: transaction,
    } as never);

    await expect(
      service.update('supabase-user-id', 'recipe-id', {
        title: 'Zupa',
        servingCount: 4,
        ingredients: [],
      }),
    ).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
      status: 404,
    });
  });

  it('deletes a recipe owned by the authenticated user', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'owner-id' });
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const service = new RecipesService({
      user: { findUnique },
      recipe: { deleteMany },
    } as never);

    await expect(
      service.delete(
        'supabase-user-id',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ),
    ).resolves.toBeUndefined();
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        ownerId: 'owner-id',
      },
    });
  });

  it('uses the same not-found response when deleting another user recipe', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      recipe: { deleteMany },
    } as never);

    await expect(
      service.delete('supabase-user-id', 'recipe-id'),
    ).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
      status: 404,
    });
  });

  it('uses the same not-found response for a malformed recipe id when deleting', async () => {
    const deleteMany = vi.fn();
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      recipe: { deleteMany },
    } as never);

    await expect(
      service.delete('supabase-user-id', 'not-a-uuid'),
    ).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
      status: 404,
    });
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
