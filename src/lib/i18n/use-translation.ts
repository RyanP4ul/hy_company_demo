'use client';

import { useLanguageStore, type Language } from '@/stores/language';
import translations from '@/lib/i18n/translations';
import type { TranslationPath } from '@/lib/i18n/translations';

/**
 * Get a nested value from an object using a dot-notation path.
 * e.g. getNestedValue(obj, 'nav.dashboard')
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback: return the key path itself
    }
  }
  return typeof current === 'string' ? current : path;
}

/**
 * Hook for translated strings.
 * Usage: const { t } = useTranslation();
 *        t('nav.dashboard') => 'Dashboard'
 */
export function useTranslation() {
  const language = useLanguageStore((s) => s.language);

  function t(path: string): string {
    const langTranslations = translations[language as Language] ?? translations.en;
    const result = getNestedValue(
      langTranslations as unknown as Record<string, unknown>,
      path
    );
    // Fallback to English if the translation is the same as the key
    if (result === path && language !== 'en') {
      const enResult = getNestedValue(
        translations.en as unknown as Record<string, unknown>,
        path
      );
      return enResult;
    }
    return result;
  }

  return { t, language };
}

export type { TranslationPath };
