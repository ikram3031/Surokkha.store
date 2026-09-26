import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import bn from './locales/bn.json';

const savedLang = typeof window !== 'undefined' ? (localStorage.getItem('dashboard_lang') || 'en') : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bn: { translation: bn }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Sets the application active language and persists selection in storage
export const setAppLanguage = (lang) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboard_lang', lang);
  }
  return i18n.changeLanguage(lang);
};

export default i18n;
