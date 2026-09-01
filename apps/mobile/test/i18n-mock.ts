import { vi } from 'vitest';
import { useI18n } from '../src/i18n/i18n';
import { translate } from '../src/i18n/translations';

export function mockI18n(language: 'pl' | 'en') {
  vi.mocked(useI18n).mockReturnValue({
    language,
    setLanguage: vi.fn(),
    t: (key, params) => translate(key, params, language),
  });
}
