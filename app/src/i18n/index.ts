import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { enTranslation, jaTranslation } from './translation';

export function init() {
  i18next.use(LanguageDetector).init({
    detection: {
      lookupQuerystring: 'hl',
    },
    fallbackLng: 'en',
    resources: {
      en: {
        translation: enTranslation,
      },
      ja: {
        translation: jaTranslation,
      },
    },
  });
}

export const t = i18next.t;
