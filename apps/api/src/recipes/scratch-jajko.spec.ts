import { describe, expect, it, vi } from 'vitest';
import { IngredientCatalogResolver } from './ingredient-catalog.resolver';
import type { RecipeExtractionProvider } from '../ai/recipe-extraction.provider';
import type { RawExtractRecipeDraft } from '@dinner/shared';

interface FakeCatalogEntry {
  id: string;
  slug: string;
  namePl: string;
  nameEn: string;
  isSystem: boolean;
  isActive: boolean;
  ownerId: string | null;
  createdAt: Date;
}

const EGG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const entries: FakeCatalogEntry[] = [
  {
    id: EGG_ID,
    slug: 'egg',
    namePl: 'Jajko',
    nameEn: 'Egg',
    isSystem: true,
    isActive: true,
    ownerId: null,
    createdAt: new Date('2026-01-01'),
  },
];

function createResolver() {
  const prisma = {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'owner-a' }) },
    ingredientCatalogEntry: {
      findMany: vi.fn(async () => entries),
    },
  };
  const matchIngredients = vi.fn().mockResolvedValue([]);
  const resolver = new IngredientCatalogResolver(
    prisma as never,
    {
      matchIngredients,
    } as unknown as RecipeExtractionProvider,
  );
  return { resolver, matchIngredients };
}

describe('scratch: jajko repro', () => {
  it('matches lowercase jajko against Jajko catalog entry', async () => {
    const { resolver, matchIngredients } = createResolver();
    const draft = {
      title: 'Omlet',
      description: 'Omlet z jajkiem.',
      servingCount: 2,
      ingredients: [
        {
          name: 'jajko',
          quantity: '2',
          unit: 'PCS',
          note: null,
          position: 0,
        },
      ],
    } as RawExtractRecipeDraft;

    const resolved = await resolver.resolveDraft('auth-user-a', draft);
    console.log(
      'resolved ingredient:',
      JSON.stringify(resolved.ingredients[0]),
    );
    console.log('matchIngredients called:', matchIngredients.mock.calls);
    expect(resolved.ingredients[0].catalogEntryId).toBe(EGG_ID);
  });
});
