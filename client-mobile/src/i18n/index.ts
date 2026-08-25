import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import en from './locales/en.json';
import mr from './locales/mr.json';
import { apolloClient } from '../apollo/client';
import { loadAuthSession } from '../apollo/authStorage';
import { SET_LANGUAGE } from '../graphql/mutations/auth.mutations';

const KEY = 'nagarseva_lang';

// Additional languages can be added by dropping a new locale file here and registering it in
// `resources` — no other code needs to change. Screens are translated incrementally; anything not
// yet in a locale file falls back to its English key text via fallbackLng.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mr: { translation: mr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export async function initLanguage(): Promise<void> {
  const saved = await SecureStore.getItemAsync(KEY);
  if (saved === 'mr' || saved === 'en') await i18n.changeLanguage(saved);
}

export function setLanguage(lang: 'en' | 'mr'): void {
  i18n.changeLanguage(lang);
  SecureStore.setItemAsync(KEY, lang).catch(() => {});
  // Backend-generated notification text has no client-side translation of its own — persisting
  // the preference server-side lets it render each notification in the recipient's language at
  // creation time. Silently skipped when logged out (no session to attach it to yet); Landing's
  // pre-login toggle only needs the local UI language, not this.
  if (loadAuthSession()) {
    apolloClient.mutate({ mutation: SET_LANGUAGE, variables: { language: lang.toUpperCase() } }).catch(() => {});
  }
}

export default i18n;
