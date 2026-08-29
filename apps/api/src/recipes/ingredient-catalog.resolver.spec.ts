import { describe, expect, it, vi } from 'vitest';
import {
  IngredientCatalogResolver,
  normalizeIngredientName,
} from './ingredient-catalog.resolver';
import type { RawExtractRecipeDraft } from '@dinner/shared';

interface FakeCatalogEntry {
  id: string;
  namePl: string;
  nameEn: string;
  isSystem: boolean;
  isActive: boolean;
  ownerId: string | null;
  createdAt: Date;
}

function entry(
  id: string,
  namePl: string,
  nameEn: string,
  createdAt: string,
  options: { isSystem?: boolean; ownerId?: string | null } = {},
): FakeCatalogEntry {
  return {
    id,
    namePl,
    nameEn,
    isSystem: options.isSystem ?? true,
    isActive: true,
    ownerId: options.ownerId ?? null,
    createdAt: new Date(createdAt),
  };
}

function createResolver(entries: FakeCatalogEntry[], ownerId = 'owner-a') {
  const findMany = vi.fn(
    async ({ where }: { where: { isActive?: boolean; OR?: unknown[] } }) =>
      entries.filter((candidate) => {
        if (where.isActive && !candidate.isActive) {
          return false;
        }
        return candidate.isSystem || candidate.ownerId === ownerId;
      }),
  );
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: ownerId }),
    },
    ingredientCatalogEntry: { findMany },
  };
  const resolver = new IngredientCatalogResolver(prisma as never);
  return { resolver, findMany };
}

describe('normalizeIngredientName', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    expect(normalizeIngredientName('  Mąka  ')).toBe('mąka');
    expect(normalizeIngredientName('Pierś   z   kurczaka')).toBe(
      'pierś z kurczaka',
    );
  });

  it('strips trailing and inner punctuation', () => {
    expect(normalizeIngredientName('Mąka.')).toBe('mąka');
    expect(normalizeIngredientName('egg,')).toBe('egg');
    expect(normalizeIngredientName('Tomato!')).toBe('tomato');
  });

  it('strips quantity artifacts and parenthetical noise', () => {
    expect(normalizeIngredientName('2 pomidory')).toBe('pomidory');
    expect(normalizeIngredientName('mleko 3,2')).toBe('mleko');
    expect(normalizeIngredientName('Mleko 500g')).toBe('mleko');
    expect(normalizeIngredientName('jajko (duże)')).toBe('jajko duże');
  });

  it('treats hyphenated and slash forms as word separators', () => {
    expect(normalizeIngredientName('oliwa-z-oliwek')).toBe('oliwa z oliwek');
    expect(normalizeIngredientName('ser topiony/dojrzewający')).toBe(
      'ser topiony dojrzewający',
    );
  });
});

describe('IngredientCatalogResolver', () => {
  it('matches bilingual catalog names case-insensitively', async () => {
    const { resolver } = createResolver([
      entry(
        'f9905d8b-55b4-409a-908e-c55b69bd392d',
        'Mąka',
        'Flour',
        '2026-01-01T00:00:00.000Z',
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', [
        'mąka',
        'flour',
        'MĄKA',
        'FLOUR',
        ' Mąka ',
      ]),
    ).resolves.toEqual([
      {
        catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
        customProposal: null,
      },
      {
        catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
        customProposal: null,
      },
      {
        catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
        customProposal: null,
      },
      {
        catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
        customProposal: null,
      },
      {
        catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
        customProposal: null,
      },
    ]);
  });

  it('matches multi-word names in both languages', async () => {
    const { resolver } = createResolver([
      entry(
        '755b4b01-6b08-4a90-9133-70d36d0f9580',
        'Pierś z kurczaka',
        'Chicken breast',
        '2026-01-01',
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', [
        'Pierś z kurczaka',
        'chicken breast',
        'PIERŚ Z KURCZAKA',
      ]),
    ).resolves.toEqual([
      {
        catalogEntryId: '755b4b01-6b08-4a90-9133-70d36d0f9580',
        customProposal: null,
      },
      {
        catalogEntryId: '755b4b01-6b08-4a90-9133-70d36d0f9580',
        customProposal: null,
      },
      {
        catalogEntryId: '755b4b01-6b08-4a90-9133-70d36d0f9580',
        customProposal: null,
      },
    ]);
  });

  it('matches names carrying punctuation and quantity noise', async () => {
    const { resolver } = createResolver([
      entry(
        '10601a72-f0f8-4928-95a0-e27bd2fee67f',
        'Mleko',
        'Milk',
        '2026-01-01',
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', ['mleko.', 'mleko 3,2', 'Milk 500']),
    ).resolves.toEqual([
      {
        catalogEntryId: '10601a72-f0f8-4928-95a0-e27bd2fee67f',
        customProposal: null,
      },
      {
        catalogEntryId: '10601a72-f0f8-4928-95a0-e27bd2fee67f',
        customProposal: null,
      },
      {
        catalogEntryId: '10601a72-f0f8-4928-95a0-e27bd2fee67f',
        customProposal: null,
      },
    ]);
  });

  it('matches hyphenated and slash forms against spaced catalog names', async () => {
    const { resolver } = createResolver([
      entry(
        '7dbdedb1-6b12-46e1-9ec2-0aba0898f8ba',
        'Oliwa z oliwek',
        'Olive oil',
        '2026-01-01',
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', ['oliwa-z-oliwek', 'olive-oil']),
    ).resolves.toEqual([
      {
        catalogEntryId: '7dbdedb1-6b12-46e1-9ec2-0aba0898f8ba',
        customProposal: null,
      },
      {
        catalogEntryId: '7dbdedb1-6b12-46e1-9ec2-0aba0898f8ba',
        customProposal: null,
      },
    ]);
  });

  it('proposes a custom identity for unmatched names in the source language', async () => {
    const { resolver } = createResolver([
      entry(
        '7dbdedb1-6b12-46e1-9ec2-0aba0898f8ba',
        'Sól',
        'Salt',
        '2026-01-01',
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', ['szafran', 'saffron']),
    ).resolves.toEqual([
      {
        catalogEntryId: null,
        customProposal: { namePl: 'szafran', nameEn: 'szafran' },
      },
      {
        catalogEntryId: null,
        customProposal: { namePl: 'saffron', nameEn: 'saffron' },
      },
    ]);
  });

  it('matches a user custom entry for its owner', async () => {
    const { resolver } = createResolver([
      entry(
        '5c0ca9d3-359b-4151-94a9-ff3e33aae9ad',
        'Śmietana',
        'Śmietana',
        '2026-01-02',
        {
          isSystem: false,
          ownerId: 'owner-a',
        },
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', ['śmietana']),
    ).resolves.toEqual([
      {
        catalogEntryId: '5c0ca9d3-359b-4151-94a9-ff3e33aae9ad',
        customProposal: null,
      },
    ]);
  });

  it('does not match a custom entry owned by another user', async () => {
    const { resolver } = createResolver([
      entry(
        '42f9a8b7-d6c2-4a61-a374-988880ba3e56',
        'Sekret',
        'Sekret',
        '2026-01-02',
        {
          isSystem: false,
          ownerId: 'owner-b',
        },
      ),
    ]);

    await expect(resolver.resolve('auth-user-a', ['sekret'])).resolves.toEqual([
      {
        catalogEntryId: null,
        customProposal: { namePl: 'sekret', nameEn: 'sekret' },
      },
    ]);
  });

  it('resolves to the system entry when a custom entry shares a name', async () => {
    const { resolver } = createResolver([
      entry(
        'ca352c2c-a08d-4a91-8f1c-3d581501cc8b',
        'Pomidor',
        'Pomidor',
        '2026-01-03',
        {
          isSystem: false,
          ownerId: 'owner-a',
        },
      ),
      entry(
        'c233e312-4c7b-4b6f-ab00-9ccd8675c5c1',
        'Pomidor',
        'Tomato',
        '2026-01-01',
      ),
    ]);

    await expect(resolver.resolve('auth-user-a', ['pomidor'])).resolves.toEqual(
      [
        {
          catalogEntryId: 'c233e312-4c7b-4b6f-ab00-9ccd8675c5c1',
          customProposal: null,
        },
      ],
    );
  });

  it('keeps results aligned with the requested name order', async () => {
    const { resolver } = createResolver([
      entry(
        'f9905d8b-55b4-409a-908e-c55b69bd392d',
        'Mąka',
        'Flour',
        '2026-01-01',
      ),
      entry(
        '7dbdedb1-6b12-46e1-9ec2-0aba0898f8ba',
        'Sól',
        'Salt',
        '2026-01-01',
      ),
    ]);

    await expect(
      resolver.resolve('auth-user-a', ['salt', 'unknown', 'flour']),
    ).resolves.toEqual([
      {
        catalogEntryId: '7dbdedb1-6b12-46e1-9ec2-0aba0898f8ba',
        customProposal: null,
      },
      {
        catalogEntryId: null,
        customProposal: { namePl: 'unknown', nameEn: 'unknown' },
      },
      {
        catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
        customProposal: null,
      },
    ]);
  });

  it('resolves a draft by matching names and proposing the rest', async () => {
    const { resolver } = createResolver([
      entry(
        'f9905d8b-55b4-409a-908e-c55b69bd392d',
        'Mąka',
        'Flour',
        '2026-01-01',
      ),
    ]);
    const draft = {
      title: 'Zupa',
      description: 'Kremowa zupa.',
      servingCount: 4,
      ingredients: [
        {
          name: 'Mąka',
          quantity: '200',
          unit: 'G',
          note: null,
          position: 0,
        },
        {
          name: 'Szafran',
          quantity: null,
          unit: 'OTHER',
          note: null,
          position: 1,
        },
      ],
      preparationSteps: [{ text: 'Gotuj', position: 0 }],
    } as RawExtractRecipeDraft;

    await expect(resolver.resolveDraft('auth-user-a', draft)).resolves.toEqual({
      ...draft,
      ingredients: [
        {
          name: 'Mąka',
          catalogEntryId: 'f9905d8b-55b4-409a-908e-c55b69bd392d',
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
      ],
    });
  });
});
