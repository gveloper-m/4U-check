import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en';
import el from './el';
import de from './de';
import fr from './fr';
import es from './es';
import nl from './nl';
import cs from './cs';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      el: { translation: el },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      nl: { translation: nl },
      cs: { translation: cs },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'el', 'de', 'fr', 'es', 'nl', 'cs'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: '4utest_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
