import { describe, expect, it, vi } from 'vitest';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  it('creates a recipe for the authenticated application user', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'owner-id' });
    const create = vi.fn().mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      title: 'Zupa',
      description: null,
      servingCount: 4,
      createdAt: new Date('2026-08-28T12:00:00.000Z'),
      updatedAt: new Date('2026-08-28T12:00:00.000Z'),
    });
    const service = new RecipesService({
      user: { findUnique },
      recipe: { create },
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
    expect(create).toHaveBeenCalledWith({
      data: {
        ownerId: 'owner-id',
        title: 'Zupa',
        description: null,
        servingCount: 4,
      },
    });
  });
});
