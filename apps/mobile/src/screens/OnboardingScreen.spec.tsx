import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { I18nProvider } from '../i18n/I18nProvider';
import { initI18n } from '../i18n/init-i18n';
import { en } from '../i18n/locales/en';
import { he } from '../i18n/locales/he';
import { sizing } from '../theme/tokens';
import OnboardingScreen from './OnboardingScreen';

// Onboarding carousel (Screen 1), DESIGN_GUIDELINES §9: exactly 3 pages, each
// resolving one hesitation (value proposition / how sessions work / why
// permissions matter — placeholder copy, flagged for the later copy pass),
// with pagination dots, a skip affordance on non-final pages, and one clear
// primary action per state (§1): Next on non-final pages, Get Started on the
// final page.
//
// Pinned contracts:
// - Completion: the screen takes an `onComplete` callback and fires it when
//   skip is pressed OR the final-page CTA is pressed — nothing else. The App
//   gate (App.spec.tsx) owns what completion means (mark seen -> leave
//   onboarding, with Screen 2 slotting into that flow when it exists); the
//   carousel never touches storage or navigation itself.
// - Paging math derives the active page from the scroll event's OWN
//   layoutMeasurement.width — never a captured window dimension. The swipe
//   test uses a page width that differs from the Jest window default
//   deliberately, so a Dimensions-based computation fails it.
// - Token sizing: the CTA is buttonHeight (52) tall; skip declares the
//   minTouchTarget minimum (48). Tokens, never ad-hoc values.
//
// RTL: styles must use logical properties and never branch on locale
// (.claude/skills/i18n/SKILL.md) — the he render below proves the copy path; RN flips the
// horizontal list natively. Actual RTL swipe/paging direction on-device is
// not JS-testable (I18nManager is inert under Jest) and goes on the manual QA
// checklist (docs/MANUAL_QA.md) in Stage B.
//
// Determinism: no assertion depends on animations or timers — paging state is
// asserted via dot accessibilityState, driven by synthetic press/scroll
// events only. react-native-localize is mocked virtually as established; no
// test reads the machine's real locale.

interface DeviceLocaleStub {
  readonly countryCode: string;
  readonly isRTL: boolean;
  readonly languageCode: string;
  readonly languageTag: string;
}

const EN_US: DeviceLocaleStub = {
  countryCode: 'US',
  isRTL: false,
  languageCode: 'en',
  languageTag: 'en-US',
};

const mockGetLocales = jest.fn<DeviceLocaleStub[], []>();

jest.mock(
  'react-native-localize',
  () => ({
    getLocales: () => mockGetLocales(),
  }),
  { virtual: true },
);

const PAGE_COUNT = 3;
// Deliberately different from the Jest window width (750) — see header note.
const PAGE_WIDTH = 320;

const renderOnboardingIn = async (
  locale: 'en' | 'he',
  onComplete: () => void = () => undefined,
): Promise<void> => {
  const i18n = await initI18n();
  await i18n.changeLanguage(locale);

  // RNTL v14 render is async (returns a Promise) — must be awaited.
  await render(
    <I18nProvider i18n={i18n}>
      <OnboardingScreen onComplete={onComplete} />
    </I18nProvider>,
  );
};

// Simulates the momentum settle of a horizontal swipe landing on pageIndex.
// The event carries its own layout width; implementations must page off it.
const swipeToPage = async (pageIndex: number): Promise<void> => {
  await fireEvent(screen.getByTestId('onboarding-carousel'), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: PAGE_WIDTH * pageIndex, y: 0 },
      contentSize: { height: 600, width: PAGE_WIDTH * PAGE_COUNT },
      layoutMeasurement: { height: 600, width: PAGE_WIDTH },
    },
  });
};

const pressPrimaryCta = async (): Promise<void> => {
  await fireEvent.press(screen.getByTestId('onboarding-primary-cta'));
};

const expectActivePage = (activeIndex: number): void => {
  [0, 1, 2].forEach((pageIndex) => {
    const dot = screen.getByTestId(`onboarding-page-dot-${pageIndex}`);
    expect(dot.props.accessibilityState).toMatchObject({ selected: pageIndex === activeIndex });
  });
};

// The testID element must expose a static (flattenable) style — arrays fine,
// Pressable function-styles go on an inner element if used.
const flattenedStyle = (testID: string): ViewStyle =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style as StyleProp<ViewStyle>);

// DimensionValue can be a string ('50%'); the sizing contract requires plain
// numeric token values, so anything else is itself a failure.
const asNumber = (value: unknown): number => {
  if (typeof value !== 'number') {
    throw new Error(`expected a numeric style value, got: ${String(value)}`);
  }
  return value;
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
    mockGetLocales.mockReturnValue([EN_US]);
  });

  describe('pages and copy', () => {
    it('renders all three pages with their en titles and bodies from the locale module', async () => {
      await renderOnboardingIn('en');

      const pages = [
        en.onboarding.pages.valueProposition,
        en.onboarding.pages.howSessionsWork,
        en.onboarding.pages.whyPermissionsMatter,
      ];
      pages.forEach((page) => {
        expect(screen.getByText(page.title)).toBeOnTheScreen();
        expect(screen.getByText(page.body)).toBeOnTheScreen();
      });
    });

    it('renders the Hebrew copy under the he locale, proving the carousel flows through i18n', async () => {
      // Guard: identical bundles would let a hardcoded literal pass below.
      const enTitle = en.onboarding.pages.valueProposition.title;
      const heTitle = he.onboarding.pages.valueProposition.title;
      expect(heTitle).not.toBe(enTitle);

      await renderOnboardingIn('he');

      expect(screen.getByText(heTitle)).toBeOnTheScreen();
      expect(screen.queryByText(enTitle)).toBeNull();
    });

    it('exposes the screen root under the testID the App gate looks for', async () => {
      await renderOnboardingIn('en');

      expect(screen.getByTestId('onboarding-screen')).toBeOnTheScreen();
    });
  });

  describe('pagination', () => {
    it('shows three dots with the first page active on mount', async () => {
      await renderOnboardingIn('en');

      expect(screen.queryByTestId(`onboarding-page-dot-${PAGE_COUNT}`)).toBeNull();
      expectActivePage(0);
    });

    it('advances to the second page when Next is pressed', async () => {
      await renderOnboardingIn('en');

      await pressPrimaryCta();

      expectActivePage(1);
    });

    it('moves the active dot when a swipe settles, paging off the event layout width', async () => {
      await renderOnboardingIn('en');

      await swipeToPage(2);

      expectActivePage(2);
    });
  });

  describe('skip affordance', () => {
    it('shows skip with its i18n label on the first page', async () => {
      await renderOnboardingIn('en');

      expect(screen.getByText(en.onboarding.skip)).toBeOnTheScreen();
    });

    it('hides skip on the final page', async () => {
      await renderOnboardingIn('en');

      await swipeToPage(2);

      expect(screen.queryByText(en.onboarding.skip)).toBeNull();
    });

    it('fires onComplete when skip is pressed', async () => {
      const onComplete = jest.fn<void, []>();
      await renderOnboardingIn('en', onComplete);

      await fireEvent.press(screen.getByTestId('onboarding-skip'));

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('primary CTA', () => {
    it('labels the CTA Next on non-final pages and Get Started on the final page', async () => {
      await renderOnboardingIn('en');
      expect(screen.getByText(en.onboarding.next)).toBeOnTheScreen();

      await swipeToPage(2);

      expect(screen.getByText(en.onboarding.getStarted)).toBeOnTheScreen();
      expect(screen.queryByText(en.onboarding.next)).toBeNull();
    });

    it('does not fire onComplete from Next on non-final pages', async () => {
      const onComplete = jest.fn<void, []>();
      await renderOnboardingIn('en', onComplete);

      await pressPrimaryCta();

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('fires onComplete when the final-page CTA is pressed, after Next-ing through', async () => {
      const onComplete = jest.fn<void, []>();
      await renderOnboardingIn('en', onComplete);

      // Two Next presses cross-check the button path also reaches the final
      // page (the swipe path is covered separately).
      await pressPrimaryCta();
      await pressPrimaryCta();
      expect(screen.getByText(en.onboarding.getStarted)).toBeOnTheScreen();

      await pressPrimaryCta();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('token sizing (DESIGN_GUIDELINES §6)', () => {
    it('sizes the primary CTA to the button-height token', async () => {
      await renderOnboardingIn('en');

      expect(flattenedStyle('onboarding-primary-cta').height).toBe(sizing.buttonHeight);
    });

    it('declares the minimum touch target on the skip affordance', async () => {
      await renderOnboardingIn('en');

      const skipStyle = flattenedStyle('onboarding-skip');
      expect(asNumber(skipStyle.minHeight)).toBeGreaterThanOrEqual(sizing.minTouchTarget);
      expect(asNumber(skipStyle.minWidth)).toBeGreaterThanOrEqual(sizing.minTouchTarget);
    });
  });
});
