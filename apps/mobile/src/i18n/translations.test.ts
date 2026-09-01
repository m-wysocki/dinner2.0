import { describe, expect, it } from 'vitest';
import {
  formatServings,
  translate,
  translations,
  unitLabel,
} from './translations';

describe('translations', () => {
  it('provides every Polish key in English', () => {
    const plKeys = Object.keys(translations.pl);
    const enKeys = new Set(Object.keys(translations.en));

    for (const key of plKeys) {
      expect(enKeys.has(key), `missing English translation: ${key}`).toBe(true);
    }
  });

  it('interpolates parameters into the selected text', () => {
    expect(
      translate('create.savedMessage', { servings: '4 porcje' }, 'pl'),
    ).toBe('Przepis na 4 porcje został dodany do Twojej kolekcji.');
    expect(translate('api.httpError', { status: 503 }, 'en')).toBe(
      'The API returned an error (503).',
    );
  });

  it('interpolates the proposed custom ingredient name in both languages', () => {
    expect(translate('review.proposalText', { name: 'Szafran' }, 'pl')).toBe(
      'Nieznany składnik „Szafran”. Dodaj jako nowy własny składnik albo wybierz istniejący z katalogu.',
    );
    expect(translate('review.proposalText', { name: 'Saffron' }, 'en')).toBe(
      'Unknown ingredient "Saffron". Add it as a new custom ingredient or choose an existing one from the catalog.',
    );
  });
});

describe('formatServings', () => {
  it('applies Polish plural forms', () => {
    expect(formatServings(1, 'pl')).toBe('1 porcja');
    expect(formatServings(2, 'pl')).toBe('2 porcje');
    expect(formatServings(4, 'pl')).toBe('4 porcje');
    expect(formatServings(5, 'pl')).toBe('5 porcji');
    expect(formatServings(12, 'pl')).toBe('12 porcji');
    expect(formatServings(14, 'pl')).toBe('14 porcji');
    expect(formatServings(22, 'pl')).toBe('22 porcje');
    expect(formatServings(25, 'pl')).toBe('25 porcji');
  });

  it('uses the accusative singular after "for" in Polish', () => {
    expect(formatServings(1, 'pl', 'accusative')).toBe('1 porcję');
    expect(formatServings(4, 'pl', 'accusative')).toBe('4 porcje');
    expect(formatServings(5, 'pl', 'accusative')).toBe('5 porcji');
    expect(formatServings(1, 'en', 'accusative')).toBe('1 serving');
  });

  it('uses singular and plural forms in English', () => {
    expect(formatServings(1, 'en')).toBe('1 serving');
    expect(formatServings(4, 'en')).toBe('4 servings');
  });
});

describe('unitLabel', () => {
  it('localizes canonical units', () => {
    expect(unitLabel('PCS', 'pl')).toBe('szt.');
    expect(unitLabel('PCS', 'en')).toBe('pcs');
    expect(unitLabel('TBSP', 'pl')).toBe('łyżka');
    expect(unitLabel('TBSP', 'en')).toBe('tbsp');
  });
});
