import { describe, expect, it, vi } from 'vitest';
import { RecipesController } from './recipes.controller';

describe('RecipesController', () => {
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
});
