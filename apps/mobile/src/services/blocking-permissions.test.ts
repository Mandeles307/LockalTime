import { blockingPermissions } from './blocking-permissions';

// Phase 1 blocking-permission service contract (backlog: "Permission-priming
// screen copy/logic (Screen 2)"). The REAL permission requests are native
// (ARCHITECTURE.md §4: Android Usage Access + SYSTEM_ALERT_WINDOW settings
// intents; iOS FamilyControls authorization, requested at Screen 2) and land
// with the Phase 3 native bridge. What Phase 1 pins is the SURFACE the screen
// codes against, so the Phase 3 swap changes only this module's internals —
// never the screen:
//
// - `blockingPermissions.getStatus()` / `.request()` both resolve a
//   discriminated BlockingPermissionStatus: 'granted' | 'denied' |
//   'undetermined'. One combined status for the blocking capability as a
//   whole — per-platform nuance (Android's two separate grants) stays inside
//   the future native module, which reports the weakest link
//   (skills/testing-standards.md native-modules rule: JS-side contract test
//   over a mocked/absent bridge; real OS behavior is manual QA in Phase 3).
// - The Phase 1 implementation is a pure-JS placeholder, deterministic by
//   design: getStatus() always resolves 'undetermined' (nothing native exists
//   to consult) and request() always resolves 'denied' (no bridge exists that
//   could actually grant — resolving 'granted' here would fake a capability
//   the app does not have). This also means Phase 1 dev builds exercise the
//   denied-fallback path for real, which is the state that actually needs the
//   recovery UX.
// - Neither call ever rejects: permission state is an answer, not an error
//   (the screen's fail-open posture depends on this).
//
// Determinism: no native modules, no timers, no storage — pure JS.

describe('blockingPermissions.getStatus', () => {
  it("resolves 'undetermined' — the placeholder has no native source to consult", async () => {
    await expect(blockingPermissions.getStatus()).resolves.toEqual({ status: 'undetermined' });
  });
});

describe('blockingPermissions.request', () => {
  it("resolves 'denied' — the placeholder can never mint a grant it cannot enforce", async () => {
    await expect(blockingPermissions.request()).resolves.toEqual({ status: 'denied' });
  });
});

describe('determinism of the placeholder', () => {
  it('returns the same statuses on every call, in any interleaving', async () => {
    // Statelessness is a placeholder-specific property (a real native module
    // would report 'denied' from getStatus after a denied request); this case
    // is replaced together with the implementation in Phase 3.
    await expect(blockingPermissions.getStatus()).resolves.toEqual({ status: 'undetermined' });
    await expect(blockingPermissions.request()).resolves.toEqual({ status: 'denied' });
    await expect(blockingPermissions.getStatus()).resolves.toEqual({ status: 'undetermined' });
    await expect(blockingPermissions.request()).resolves.toEqual({ status: 'denied' });
  });
});
