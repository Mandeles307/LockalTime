import React from 'react';
import { I18nManager } from 'react-native';

import { render, screen, waitFor } from '@testing-library/react-native';

import App from './App';
import { en } from './i18n/locales/en';

// App bootstrap contract. The Phase 0 smoke test (testID) proves React
// Navigation boots; the Phase 1 additions prove App actually wires the i18n
// foundation — mounts the provider with an initialized instance (raw keys or
// a hardcoded literal would fail the visible-text assertion) and invokes the
// layout-direction sync. Without these, an App that never mounts I18nProvider
// would silently pass on react-i18next's uninitialized default instance.
// react-native-localize is mocked virtually (not installed until Stage B);
// no test reads the machine's real locale. Color palette is deferred, so no
// style/color assertions.

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

describe('App', () => {
  let forceRTLSpy: jest.SpyInstance<void, [forceRTL: boolean]>;

  beforeEach(() => {
    mockGetLocales.mockReset();
    mockGetLocales.mockReturnValue([EN_US]);
    // I18nManager is mocked in every test here (not just the RTL one) so the
    // bootstrap can never mutate real native layout state mid-suite.
    jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => undefined);
    forceRTLSpy = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the Home placeholder screen as the initial route', async () => {
    // RNTL v14 render is async (returns a Promise) — must be awaited.
    await render(<App />);

    // findBy* awaits React Navigation's async mount of the initial screen.
    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
  });

  it('shows the en home title for an en-US device, proving App mounts the i18n provider', async () => {
    await render(<App />);

    // findBy* also awaits App's async i18n init before the first paint of
    // translated text. Asserts against the locale module, never a literal.
    expect(await screen.findByText(en.home.title)).toBeOnTheScreen();
  });

  it('syncs the layout direction to LTR for an en device locale during bootstrap', async () => {
    await render(<App />);

    // waitFor covers an async bootstrap: the call must land once init settles.
    await waitFor(() => {
      expect(forceRTLSpy).toHaveBeenCalledWith(false);
    });
    expect(forceRTLSpy).not.toHaveBeenCalledWith(true);
  });
});
