/**
 * i18n setup using i18next.
 *
 * Language detection order:
 * 1. URL path prefix (e.g. /pt/, /es/) — canonical SEO signal
 * 2. Browser language (navigator.language)
 * 3. Fallback: English
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

const SUPPORTED_LANGS = ['pt', 'es', 'ja', 'de', 'zh', 'tr', 'fr'] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number] | 'en';

/** Extract language from URL path prefix, e.g. /pt/ → 'pt'. Returns null if not found. */
function langFromPath(): SupportedLang | null {
  const match = window.location.pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (!match) return null;
  const prefix = match[1] as SupportedLang;
  return (SUPPORTED_LANGS as readonly string[]).includes(prefix) ? prefix : null;
}

/** Map a raw browser locale to one of our supported language codes. */
function langFromBrowser(): SupportedLang {
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

function detectLanguage(): SupportedLang {
  return langFromPath() ?? langFromBrowser();
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

const BASE_URL = 'https://sudoku-of-the-day.com';

const OG_LOCALES: Record<string, string> = {
  en: 'en_US', pt: 'pt_BR', es: 'es_ES',
  de: 'de_DE', fr: 'fr_FR', ja: 'ja_JP',
  zh: 'zh_CN', tr: 'tr_TR',
};

/** Update document metadata based on active language */
function updateDocumentMetadata() {
  const lang = i18n.language;
  const pathPrefix = lang === 'en' ? '' : `/${lang}`;
  const canonicalUrl = `${BASE_URL}${pathPrefix}/`;

  document.documentElement.lang = lang;
  document.title = i18n.t('app.title');
  document.querySelector('meta[name="description"]')
    ?.setAttribute('content', i18n.t('app.description'));

  // Canonical URL
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  // OG URL + locale
  document.querySelector('meta[property="og:url"]')
    ?.setAttribute('content', canonicalUrl);
  document.querySelector('meta[property="og:locale"]')
    ?.setAttribute('content', OG_LOCALES[lang] ?? 'en_US');

  // OG title + description (translated)
  document.querySelector('meta[property="og:title"]')
    ?.setAttribute('content', i18n.t('app.title'));
  document.querySelector('meta[property="og:description"]')
    ?.setAttribute('content', i18n.t('app.description'));
  document.querySelector('meta[name="twitter:title"]')
    ?.setAttribute('content', i18n.t('app.title'));
  document.querySelector('meta[name="twitter:description"]')
    ?.setAttribute('content', i18n.t('app.description'));
}

// Update metadata on initialization and whenever language changes
updateDocumentMetadata();
i18n.on('languageChanged', updateDocumentMetadata);

export default i18n;
