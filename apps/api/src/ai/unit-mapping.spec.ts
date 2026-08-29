import { describe, expect, it } from 'vitest';
import { mapUnitToCanonical } from './unit-mapping';

describe('mapUnitToCanonical', () => {
  it('maps recognizable units to the canonical enum', () => {
    expect(mapUnitToCanonical('g', null)).toEqual({ unit: 'G', note: null });
    expect(mapUnitToCanonical('gramów', null)).toEqual({
      unit: 'G',
      note: null,
    });
    expect(mapUnitToCanonical('kg', null)).toEqual({ unit: 'KG', note: null });
    expect(mapUnitToCanonical('mililitr', null)).toEqual({
      unit: 'ML',
      note: null,
    });
    expect(mapUnitToCanonical('litr', null)).toEqual({ unit: 'L', note: null });
    expect(mapUnitToCanonical('szt', null)).toEqual({
      unit: 'PCS',
      note: null,
    });
    expect(mapUnitToCanonical('łyżeczka', null)).toEqual({
      unit: 'TSP',
      note: null,
    });
    expect(mapUnitToCanonical('łyżka', null)).toEqual({
      unit: 'TBSP',
      note: null,
    });
  });

  it('is case-insensitive and trims trailing punctuation', () => {
    expect(mapUnitToCanonical('  G. ', null)).toEqual({
      unit: 'G',
      note: null,
    });
    expect(mapUnitToCanonical('Kilogram', null)).toEqual({
      unit: 'KG',
      note: null,
    });
    expect(mapUnitToCanonical('szt.', null)).toEqual({
      unit: 'PCS',
      note: null,
    });
  });

  it('falls back to OTHER and preserves the original text in the note', () => {
    expect(mapUnitToCanonical('szklanka', null)).toEqual({
      unit: 'OTHER',
      note: 'szklanka',
    });
    expect(mapUnitToCanonical('szklanka', 'drożdżowa')).toEqual({
      unit: 'OTHER',
      note: 'drożdżowa (szklanka)',
    });
  });

  it('leaves an already-canonical OTHER unit untouched', () => {
    expect(mapUnitToCanonical('OTHER', 'szklanka')).toEqual({
      unit: 'OTHER',
      note: 'szklanka',
    });
  });

  it('leaves the note untouched for a recognized unit', () => {
    expect(mapUnitToCanonical('g', 'posiekana')).toEqual({
      unit: 'G',
      note: 'posiekana',
    });
  });

  it('maps a missing or empty unit to OTHER without inventing a note', () => {
    expect(mapUnitToCanonical(null, null)).toEqual({
      unit: 'OTHER',
      note: null,
    });
    expect(mapUnitToCanonical('   ', 'uwaga')).toEqual({
      unit: 'OTHER',
      note: 'uwaga',
    });
  });
});
