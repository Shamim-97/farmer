'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getTranslation, formatTranslation } from './config';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * I18n Provider Component
 * Wrap your app with this to enable translations
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language | null;
      if (savedLang && (savedLang === 'en' || savedLang === 'bn')) {
        setLanguageState(savedLang);
      }
      setMounted(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const text = getTranslation(language, key, key);
    return formatTranslation(text, variables);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use translations in components
 * Usage: const { t, language } = useI18n();
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/**
 * Hook to get current language
 * Usage: const language = useLanguage();
 */
export function useLanguage(): Language {
  const { language } = useI18n();
  return language;
}
