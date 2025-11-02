import { useTranslation } from 'react-i18next';

/**
 * Hook to get localized content for tours, services, and other i18n-enabled entities
 * Falls back to original content if translation is not available
 */
export function useLocalizedContent<T extends {
  title: string;
  description: string;
  i18n_payload?: Record<string, any> | null;
}>(content: T): T {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  // If no i18n_payload or no translation for current language, return original
  if (!content.i18n_payload || !content.i18n_payload[currentLang]) {
    return content;
  }

  // Merge translated fields with original content
  return {
    ...content,
    ...content.i18n_payload[currentLang]
  };
}

/**
 * Non-hook version for use outside React components
 */
export function getLocalizedContent<T extends {
  title: string;
  description: string;
  i18n_payload?: Record<string, any> | null;
}>(content: T, language: string): T {
  // If no i18n_payload or no translation for current language, return original
  if (!content.i18n_payload || !content.i18n_payload[language]) {
    return content;
  }

  // Merge translated fields with original content
  return {
    ...content,
    ...content.i18n_payload[language]
  };
}
