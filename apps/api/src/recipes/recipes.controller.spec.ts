import { describe, expect, it, vi } from 'vitest';
import { RecipesController } from './recipes.controller';

describe('RecipesController', () => {
  it('delegates collection listing using the verified identity', async () => {
    const list = vi.fn().mockResolvedValue([]);
    const controller = new RecipesController({ list } as never);

    await expect(
      controller.list({ headers: {}, supabaseAuthId: 'supabase-user-id' }),
    ).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith('supabase-user-id');
  });

  it('delegates creation using the verified identity', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'recipe-id' });
    const controller = new RecipesController({ create } as never);

    await expect(
      controller.create(
        { headers: {}, supabaseAuthId: 'supabase-user-id' },
        { title: 'Zupa', servingCount: 4 },
      ),
    ).resolves.toEqual({ id: 'recipe-id' });
    expect(create).toHaveBeenCalledWith('supabase-user-id', {
      title: 'Zupa',
      servingCount: 4,
    });
  });

  it('delegates recipe retrieval using the verified identity and route id', async () => {
    const get = vi.fn().mockResolvedValue({ id: 'recipe-id' });
    const controller = new RecipesController({ get } as never);

    await expect(
      controller.get(
        { headers: {}, supabaseAuthId: 'supabase-user-id' },
        'recipe-id',
      ),
    ).resolves.toEqual({ id: 'recipe-id' });
    expect(get).toHaveBeenCalledWith('supabase-user-id', 'recipe-id');
  });

  it('delegates recipe updates using the verified identity and route id', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'recipe-id' });
    const controller = new RecipesController({ update } as never);

    await expect(
      controller.update(
        { headers: {}, supabaseAuthId: 'supabase-user-id' },
        'recipe-id',
        {
          title: 'Zupa ulepszona',
          servingCount: 6,
          ingredients: [],
          preparationSteps: [],
        },
      ),
    ).resolves.toEqual({ id: 'recipe-id' });
    expect(update).toHaveBeenCalledWith('supabase-user-id', 'recipe-id', {
      title: 'Zupa ulepszona',
      servingCount: 6,
      ingredients: [],
      preparationSteps: [],
    });
  });
});
