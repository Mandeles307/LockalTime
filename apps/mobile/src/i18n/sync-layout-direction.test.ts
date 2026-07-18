import { I18nManager } from 'react-native';

import { syncLayoutDirection } from './sync-layout-direction';

// Phase 1 i18n foundation: RTL is driven through RN's I18nManager per the
// locked technical direction. syncLayoutDirection(locale) is the one place
// that translates the resolved app locale into I18nManager calls; screens
// never touch I18nManager directly. Note: forceRTL only takes effect on the
// next app start — this contract covers the calls, not the (native) reload
// behavior, which stays on the manual QA checklist.
describe('syncLayoutDirection', () => {
  let allowRTLSpy: jest.SpyInstance<void, [allowRTL: boolean]>;
  let forceRTLSpy: jest.SpyInstance<void, [forceRTL: boolean]>;

  beforeEach(() => {
    allowRTLSpy = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => undefined);
    forceRTLSpy = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows RTL and forces an RTL layout for he', () => {
    syncLayoutDirection('he');

    expect(allowRTLSpy).toHaveBeenCalledWith(true);
    expect(forceRTLSpy).toHaveBeenCalledWith(true);
  });

  it('forces an LTR layout for en', () => {
    syncLayoutDirection('en');

    expect(forceRTLSpy).toHaveBeenCalledWith(false);
    expect(forceRTLSpy).not.toHaveBeenCalledWith(true);
  });
});
