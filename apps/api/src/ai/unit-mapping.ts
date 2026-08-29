import type { CanonicalUnit } from '@dinner/shared';

export interface MappedUnit {
  unit: CanonicalUnit;
  note: string | null;
}

const UNIT_ALIASES: ReadonlyArray<readonly [CanonicalUnit, readonly string[]]> =
  [
    ['G', ['g', 'gram', 'grams', 'gramy', 'gramów', 'gramme', 'grammes']],
    ['KG', ['kg', 'kilogram', 'kilograms', 'kilogramy', 'kilogramów']],
    [
      'ML',
      [
        'ml',
        'mililitr',
        'milliliter',
        'milliliters',
        'mililitry',
        'mililitrów',
      ],
    ],
    ['L', ['l', 'litr', 'liter', 'liters', 'litry', 'litrów']],
    [
      'PCS',
      ['pcs', 'pc', 'piece', 'pieces', 'szt', 'sztuka', 'sztuki', 'sztuk'],
    ],
    [
      'TSP',
      ['tsp', 'teaspoon', 'teaspoons', 'łyżeczka', 'łyżeczki', 'łyżeczek'],
    ],
    ['TBSP', ['tbsp', 'tablespoon', 'tablespoons', 'łyżka', 'łyżki', 'łyżek']],
    ['OTHER', ['other']],
  ];

const ALIAS_TO_UNIT = new Map<string, CanonicalUnit>();

for (const [unit, aliases] of UNIT_ALIASES) {
  for (const alias of aliases) {
    ALIAS_TO_UNIT.set(alias, unit);
  }
}

function normalizeUnit(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, '').replace(/[()]/g, '');
}

export function mapUnitToCanonical(
  rawUnit: string | null | undefined,
  existingNote: string | null,
): MappedUnit {
  const original = rawUnit?.trim();
  if (!original) {
    return { unit: 'OTHER', note: existingNote };
  }

  const canonical = ALIAS_TO_UNIT.get(normalizeUnit(original));

  if (canonical) {
    return { unit: canonical, note: existingNote };
  }

  const note = existingNote ? `${existingNote} (${original})` : original;
  return { unit: 'OTHER', note };
}
