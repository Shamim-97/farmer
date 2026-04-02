'use client';

import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { languages } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-3">
      <Globe className="h-5 w-5 text-slate-600" />
      <span className="text-sm font-medium text-slate-900">
        {t('common.settings')}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('bn')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            language === 'bn'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          বাংলা
        </button>
      </div>
    </div>
  );
}

/**
 * Simple language toggle button (for header)
 */
export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-slate-900"
    >
      <Globe className="h-4 w-4" />
      <span>{language.toUpperCase()}</span>
    </button>
  );
}
