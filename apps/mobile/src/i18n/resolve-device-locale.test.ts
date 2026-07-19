import { resolveDeviceLocale, type DeviceLocalePreference } from './resolve-device-locale';

// Phase 1 i18n foundation: pure device-locale selection. The resolver is the
// single place that maps the device's ordered language preferences (the shape
// react-native-localize's getLocales() reports) onto a supported app locale.
// It is deliberately a pure function — the actual getLocales() call lives in
// init-i18n — so these cases run with no native module and never depend on
// the test machine's real locale (determinism rule, .claude/skills/testing-standards/SKILL.md).
// It deliberately keys off languageCode only: region subtags (he-IL, en-GB)
// must not affect which bundle loads.
describe('resolveDeviceLocale', () => {
  interface ResolveDeviceLocaleCase {
    readonly name: string;
    readonly deviceLocales: readonly DeviceLocalePreference[];
    readonly expected: 'en' | 'he';
  }

  const CASES: readonly ResolveDeviceLocaleCase[] = [
    {
      name: 'picks he when the device prefers Hebrew',
      deviceLocales: [{ languageCode: 'he' }],
      expected: 'he',
    },
    {
      name: 'picks en when the device prefers English',
      deviceLocales: [{ languageCode: 'en' }],
      expected: 'en',
    },
    {
      name: 'falls back to en when no device preference is supported',
      deviceLocales: [{ languageCode: 'fr' }],
      expected: 'en',
    },
    {
      name: 'falls back to en when the device reports no preferences at all',
      deviceLocales: [],
      expected: 'en',
    },
    {
      name: 'skips unsupported preferences and honors a later Hebrew preference',
      deviceLocales: [{ languageCode: 'fr' }, { languageCode: 'he' }],
      expected: 'he',
    },
    {
      name: 'respects the device preference order between supported languages',
      deviceLocales: [{ languageCode: 'he' }, { languageCode: 'en' }],
      expected: 'he',
    },
    {
      name: 'picks the first supported preference, not the first RTL one',
      deviceLocales: [{ languageCode: 'fr' }, { languageCode: 'en' }, { languageCode: 'he' }],
      expected: 'en',
    },
    {
      // Java's Locale API still canonicalizes Hebrew to its legacy ISO code
      // "iw" on some Android versions; Hebrew is our RTL locale, so this
      // normalization is load-bearing, not cosmetic.
      name: 'normalizes the legacy Android "iw" code to he',
      deviceLocales: [{ languageCode: 'iw' }],
      expected: 'he',
    },
  ];

  it.each(CASES)('$name', ({ deviceLocales, expected }) => {
    expect(resolveDeviceLocale(deviceLocales)).toBe(expected);
  });
});
