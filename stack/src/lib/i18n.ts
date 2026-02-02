import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

export type Locale = 'en' | 'es' | 'hi' | 'fr' | 'zh' | 'pt';

export const SUPPORTED_LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, any>, path: string): string {
  const result = path.split('.').reduce<any>((acc, part) => acc && acc[part], obj);
  return typeof result === 'string' ? result : path;
}

// Hook to use translations
export function useTranslation() {
  const router = useRouter();
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const locale = (router.locale || 'en') as Locale;

  useEffect(() => {
    // Load translations for current locale
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English
        try {
          const fallback = await fetch('/locales/en/common.json');
          if (fallback.ok) {
            setTranslations(await fallback.json());
          }
        } catch (e) {
          console.error('Failed to load fallback translations:', e);
        }
      }
    };

    loadTranslations();
  }, [locale]);

  // Translation function
  const t = useCallback((key: string, replacements?: Record<string, string>) => {
    let text = getNestedValue(translations, key);
    
    // Replace placeholders like {{name}} with actual values
    if (replacements && typeof text === 'string') {
      Object.entries(replacements).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }
    
    return text;
  }, [translations]);

  // Change locale function
  const changeLocale = useCallback((newLocale: Locale) => {
    router.push(router.pathname, router.asPath, { locale: newLocale });
  }, [router]);

  return {
    t,
    locale,
    changeLocale,
    locales: SUPPORTED_LOCALES,
  };
}

export default useTranslation;
