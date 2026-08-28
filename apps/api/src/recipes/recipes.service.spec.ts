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
        preparationSteps: [],
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
      include: { preparationSteps: { orderBy: { position: 'asc' } } },
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
      preparationSteps: [],
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
        preparationSteps: { create: [] },
      }),
      include: { preparationSteps: true },
    });
  });

  it('creates ordered preparation steps in the same transaction', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Zupa',
      description: null,
      servingCount: 4,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-28T12:00:00.000Z'),
      preparationSteps: [
        {
          id: '5d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          text: 'Pokrój warzywa',
          position: 0,
        },
      ],
    });
    const transaction = vi.fn((callback) => callback({ recipe: { create } }));
    const service = new RecipesService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-id' }) },
      $transaction: transaction,
    } as never);

    await expect(
      service.create('supabase-user-id', {
        title: 'Zupa',
        servingCount: 4,
        preparationSteps: [{ text: 'Pokrój warzywa', position: 0 }],
      }),
    ).resolves.toMatchObject({
      preparationSteps: [{ text: 'Pokrój warzywa', position: 0 }],
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preparationSteps: {
            create: [{ text: 'Pokrój warzywa', position: 0 }],
          },
        }),
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
          quantity: { toNumber: () => 2 },
          unit: 'PCS',
          note: null,
          position: 0,
        },
      ],
      preparationSteps: [
        {
          id: '7d7c3f9b-3d8b-4cf6-9f41-5dfb2b2f9b2a',
          text: 'Pokrój',
          position: 0,
        },
      ],
    });
    const service = new RecipesService({
      user: { findUnique },
      recipe: { findFirst },
    } as never);

    await expect(
      service.get('supabase-user-id', 'recipe-id'),
    ).resolves.toMatchObject({
      title: 'Zupa',
      ingredients: [{ name: 'Pomidor', quantity: 2, unit: 'PCS' }],
      preparationSteps: [{ text: 'Pokrój', position: 0 }],
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'recipe-id', ownerId: 'owner-id' },
      include: {
        ingredients: { orderBy: { position: 'asc' } },
        preparationSteps: { orderBy: { position: 'asc' } },
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
});
