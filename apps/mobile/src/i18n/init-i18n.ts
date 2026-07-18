import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

import { en } from './locales/en';
import { he } from './locales/he';
import { resolveDeviceLocale } from './resolve-device-locale';

// Builds a fresh, fully configured i18n instance per call — no module-level
// singleton, so tests never share state and the runtime shell (App bootstrap)
// owns the one live instance it hands to I18nProvider.
export const initI18n = async (): Promise<i18n> => {
  const instance = i18next.createInstance();

  await instance.use(initReactI18next).init({
    fallbackLng: 'en',
    lng: resolveDeviceLocale(getLocales()),
    // 'translation' is i18next's default namespace; the foundation keeps it.
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    interpolation: {
      // React already escapes rendered strings.
      escapeValue: false,
    },
  });

  return instance;
};
