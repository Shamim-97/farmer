/**
 * i18n Configuration for FreshMarket BD
 * Simplified Bangla/English translation system
 */

import { en } from './translations/en';
import { bn } from './translations/bn';

export type Language = 'en' | 'bn';

export const languages: Record<Language, string> = {
  en: 'English',
  bn: 'বাংলা',
};

export const translations: Record<Language, typeof en> = {
  en,
  bn,
};

/**
 * Get nested translation value from object
 * Example: t('customer.orders') → 'My Orders' or 'আমার অর্ডার'
 */
export function getTranslation(
  lang: Language,
  path: string,
  defaultValue?: string
): string {
  const keys = path.split('.');
  let value: any = translations[lang];

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue || path;
    }
  }

  return typeof value === 'string' ? value : (defaultValue || path);
}

/**
 * Format translation with variables
 * Example: t('validation.minLength', { length: 6 }) → 'At least 6 characters required'
 */
export function formatTranslation(
  text: string,
  variables?: Record<string, string | number>
): string {
  if (!variables) return text;

  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}
