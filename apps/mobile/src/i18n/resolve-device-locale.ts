// Pure device-locale selection: maps the device's ordered language
// preferences (the shape react-native-localize's getLocales() reports) onto
// a supported app locale. Kept side-effect free — the actual getLocales()
// call happens in init-i18n — so this stays unit-testable with no native
// module (.claude/skills/code-style/SKILL.md: testable core vs. runtime shell).

// Structural minimum of react-native-localize's Locale: the resolver keys off
// languageCode only, so region subtags (he-IL vs. he) never affect selection.
export interface DeviceLocalePreference {
  readonly languageCode: string;
}

export type SupportedLocale = 'en' | 'he';

const FALLBACK_LOCALE: SupportedLocale = 'en';

// Java's Locale API still canonicalizes Hebrew to its legacy ISO code "iw"
// on some Android versions; Hebrew is our RTL locale, so this normalization
// is load-bearing, not cosmetic.
const LEGACY_LANGUAGE_CODES: Readonly<Record<string, SupportedLocale>> = {
  iw: 'he',
};

const toSupportedLocale = (languageCode: string): SupportedLocale | undefined => {
  const normalized = LEGACY_LANGUAGE_CODES[languageCode] ?? languageCode;
  return normalized === 'en' || normalized === 'he' ? normalized : undefined;
};

export const resolveDeviceLocale = (
  deviceLocales: readonly DeviceLocalePreference[],
): SupportedLocale => {
  for (const preference of deviceLocales) {
    const supported = toSupportedLocale(preference.languageCode);
    if (supported !== undefined) {
      return supported;
    }
  }
  return FALLBACK_LOCALE;
};
