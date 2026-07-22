import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import mr from './locales/mr.json';

const STORAGE_KEY = 'nagarseva_lang';
const savedLang = localStorage.getItem(STORAGE_KEY);

// Additional languages can be added by dropping a new locale file here and
// registering it in `resources` — no other code needs to change.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mr: { translation: mr },
  },
  lng: savedLang === 'mr' ? 'mr' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
