/**
 * i18n setup using i18next.
 *
 * Language detection order:
 * 1. Browser language (navigator.language)
 * 2. Fallback: English
 *
 * Supported: en, pt (pt-BR, pt-PT), es, ja, de, zh, tr, fr
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import tr from './locales/tr.json';
import fr from './locales/fr.json';

/** Map a raw browser locale to one of our supported language codes. */
function detectLanguage(): string {
  const lang = navigator.language?.toLowerCase() ?? 'en';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('tr')) return 'tr';
  if (lang.startsWith('fr')) return 'fr';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
    es: { translation: es },
    ja: { translation: ja },
    de: { translation: de },
    zh: { translation: zh },
    tr: { translation: tr },
    fr: { translation: fr },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

/** Update document metadata based on detected language */
function updateDocumentMetadata() {
  const lang = i18n.language;
  document.documentElement.lang = lang;
  document.title = i18n.t('app.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('app.description'));
}

// Update metadata on initialization and whenever language changes
updateDocumentMetadata();
i18n.on('languageChanged', updateDocumentMetadata);

export default i18n;
