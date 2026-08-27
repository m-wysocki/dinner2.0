import { describe, expect, it } from 'vitest';
import { interfaceLanguageSchema } from './index.js';

describe('shared contracts', () => {
  it('accepts supported interface languages', () => {
    expect(interfaceLanguageSchema.parse('pl')).toBe('pl');
    expect(interfaceLanguageSchema.parse('en')).toBe('en');
  });

  it('rejects unsupported interface languages', () => {
    expect(interfaceLanguageSchema.safeParse('de').success).toBe(false);
  });
});
