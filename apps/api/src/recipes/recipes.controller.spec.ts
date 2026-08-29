import { describe, expect, it, vi } from 'vitest';
import { RecipesController } from './recipes.controller';

const extractionService = {} as never;

describe('RecipesController', () => {
  it('delegates collection listing using the verified identity', async () => {
    const list = vi.fn().mockResolvedValue([]);
    const controller = new RecipesController(
      { list } as never,
      extractionService,
    );

    await expect(
      controller.list({ headers: {}, supabaseAuthId: 'supabase-user-id' }),
    ).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith('supabase-user-id');
  });

  it('delegates creation using the verified identity', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'recipe-id' });
    const controller = new RecipesController(
      { create } as never,
      extractionService,
    );

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
    const controller = new RecipesController(
      { get } as never,
      extractionService,
    );

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
    const controller = new RecipesController(
      { update } as never,
      extractionService,
    );

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

  it('delegates recipe deletion using the verified identity and route id', async () => {
    const deleteRecipe = vi.fn().mockResolvedValue(undefined);
    const controller = new RecipesController(
      { delete: deleteRecipe } as never,
      extractionService,
    );

    await expect(
      controller.delete(
        { headers: {}, supabaseAuthId: 'supabase-user-id' },
        'recipe-id',
      ),
    ).resolves.toBeUndefined();
    expect(deleteRecipe).toHaveBeenCalledWith('supabase-user-id', 'recipe-id');
  });

  it('delegates extraction to the extraction service', async () => {
    const extract = vi.fn().mockResolvedValue({
      title: 'Zupa',
      description: 'Zupa.',
      servingCount: 4,
      ingredients: [],
      preparationSteps: [],
    });
    const controller = new RecipesController(
      { list: vi.fn() } as never,
      { extract } as never,
    );

    await expect(
      controller.extract({
        title: 'Zupa',
        sourceText: 'Pomidor.',
        servingCount: 4,
      }),
    ).resolves.toEqual({
      title: 'Zupa',
      description: 'Zupa.',
      servingCount: 4,
      ingredients: [],
      preparationSteps: [],
    });
    expect(extract).toHaveBeenCalledWith({
      title: 'Zupa',
      sourceText: 'Pomidor.',
      servingCount: 4,
    });
  });
});
