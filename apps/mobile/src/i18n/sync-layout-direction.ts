import { I18nManager } from 'react-native';

import type { SupportedLocale } from './resolve-device-locale';

// Sole I18nManager touchpoint in the codebase — screens never import
// I18nManager directly (skills/i18n.md). Layout direction follows the
// *resolved app locale* exclusively: allowRTL(false) on the LTR path keeps an
// unsupported-RTL device (e.g. Arabic system language falling back to en)
// from flipping the layout under English strings.
// Note: forceRTL only takes effect on the next app start; that native reload
// behavior is a manual QA item, not JS-testable.
export const syncLayoutDirection = (locale: SupportedLocale): void => {
  const isRtl = locale === 'he';
  I18nManager.allowRTL(isRtl);
  I18nManager.forceRTL(isRtl);
};
