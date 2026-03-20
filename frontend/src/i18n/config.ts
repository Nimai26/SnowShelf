import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// FR
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frSettings from './locales/fr/settings.json';
import frCategories from './locales/fr/categories.json';
import frItems from './locales/fr/items.json';
import frManage from './locales/fr/manage.json';
import frAdmin from './locales/fr/admin.json';

// EN
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enSettings from './locales/en/settings.json';
import enCategories from './locales/en/categories.json';
import enItems from './locales/en/items.json';
import enManage from './locales/en/manage.json';
import enAdmin from './locales/en/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: frCommon,
        auth: frAuth,
        settings: frSettings,
        categories: frCategories,
        items: frItems,
        manage: frManage,
        admin: frAdmin,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        settings: enSettings,
        categories: enCategories,
        items: enItems,
        manage: enManage,
        admin: enAdmin,
      },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'settings', 'categories', 'items', 'manage', 'admin'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
