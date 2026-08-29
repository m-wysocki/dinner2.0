import { describe, expect, it, vi } from 'vitest';
import { RecipeExtractionService } from './recipe-extraction.service';
import type { RecipeExtractionProvider } from './recipe-extraction.provider';

const input = {
  title: 'Zupa pomidorowa',
  sourceText: 'Składniki: 2 pomidory, 200 g mąki, szklanka śmietany. Gotuj.',
  servingCount: 4,
};

function createService(provider: { extractRecipe: unknown }) {
  return new RecipeExtractionService(provider as RecipeExtractionProvider);
}

describe('RecipeExtractionService', () => {
  it('maps units, assigns positions, and returns a validated draft', async () => {
    const extractRecipe = vi.fn().mockResolvedValue({
      description: 'Kremowa zupa pomidorowa.',
      ingredients: [
        { name: 'Pomidor', quantity: '2', unit: 'PCS', note: null },
        { name: 'Mąka', quantity: '200', unit: 'g', note: null },
        { name: 'Śmietana', quantity: null, unit: 'szklanka', note: null },
      ],
      preparationSteps: [{ text: 'Gotuj pomidory' }],
    });
    const service = createService({ extractRecipe });

    await expect(service.extract(input)).resolves.toEqual({
      title: 'Zupa pomidorowa',
      description: 'Kremowa zupa pomidorowa.',
      servingCount: 4,
      ingredients: [
        {
          name: 'Pomidor',
          catalogEntryId: null,
          customProposal: { namePl: 'Pomidor', nameEn: 'Pomidor' },
          quantity: '2',
          unit: 'PCS',
          note: null,
          position: 0,
        },
        {
          name: 'Mąka',
          catalogEntryId: null,
          customProposal: { namePl: 'Mąka', nameEn: 'Mąka' },
          quantity: '200',
          unit: 'G',
          note: null,
          position: 1,
        },
        {
          name: 'Śmietana',
          catalogEntryId: null,
          customProposal: { namePl: 'Śmietana', nameEn: 'Śmietana' },
          quantity: null,
          unit: 'OTHER',
          note: 'szklanka',
          position: 2,
        },
      ],
      preparationSteps: [{ text: 'Gotuj pomidory', position: 0 }],
    });
    expect(extractRecipe).toHaveBeenCalledWith({
      title: 'Zupa pomidorowa',
      sourceText:
        'Składniki: 2 pomidory, 200 g mąki, szklanka śmietany. Gotuj.',
      servingCount: 4,
    });
  });

  it('keeps the note and unit from the provider for a recognized unit', async () => {
    const extractRecipe = vi.fn().mockResolvedValue({
      description: 'Zupa.',
      ingredients: [
        { name: 'Pomidor', quantity: '2', unit: 'PCS', note: 'dojrzały' },
      ],
      preparationSteps: [],
    });
    const service = createService({ extractRecipe });

    await expect(service.extract(input)).resolves.toMatchObject({
      ingredients: [{ unit: 'PCS', note: 'dojrzały' }],
    });
  });

  it('fails loudly when the provider throws', async () => {
    const extractRecipe = vi.fn().mockRejectedValue(new Error('provider down'));
    const service = createService({ extractRecipe });

    await expect(service.extract(input)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
      status: 502,
    });
  });

  it('fails loudly when the provider output is not Zod-valid', async () => {
    const extractRecipe = vi.fn().mockResolvedValue({
      description: 'Zupa.',
      ingredients: [
        { name: 'Pomidor', quantity: 'abc', unit: 'PCS', note: null },
      ],
      preparationSteps: [],
    });
    const service = createService({ extractRecipe });

    await expect(service.extract(input)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
      status: 502,
    });
  });

  it('fails loudly when the description is missing', async () => {
    const extractRecipe = vi.fn().mockResolvedValue({
      description: ' ',
      ingredients: [],
      preparationSteps: [],
    });
    const service = createService({ extractRecipe });

    await expect(service.extract(input)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
      status: 502,
    });
  });
});
