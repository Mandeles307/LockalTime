import { nativeSignIn } from './native-sign-in';

// Phase 1 native-sign-in service contract (backlog: "Auth error states:
// wrong OTP, network failure, OAuth account-linking dialog" — the Google /
// Apple buttons on Screen 3 need a seam to press against). The REAL flows are
// native SDKs (Google Sign-In on Android/iOS; Sign in with Apple) that yield
// an ID token which auth-service exchanges via signInWithIdToken. No native
// SDK exists yet and provider config is placeholder-only (CLAUDE.md decision),
// so — exactly like blocking-permissions.ts for Screen 2 — this module is the
// SEAM: the screen codes against this surface only, and the future task that
// adds real SDKs swaps this module's internals without touching the screen
// (.claude/skills/testing-standards/SKILL.md native-modules rule: JS-side contract test
// over a mocked/absent bridge; the real credential flow is manual QA pending,
// docs/MANUAL_QA.md).
//
// Pinned surface:
// - `nativeSignIn.signInWithGoogle()` / `.signInWithApple()` both resolve a
//   discriminated NativeSignInResult:
//     { status: 'success'; idToken: string; nonce?: string }  — SDK returned
//       a token to exchange (nonce is Apple's raw nonce when the SDK used
//       one; omitted, never undefined-valued, when absent —
//       exactOptionalPropertyTypes),
//     { status: 'cancelled' }     — the user dismissed the native sheet,
//     { status: 'unavailable' }   — the provider cannot run on this build.
// - The Phase 1 implementation is a pure-JS placeholder, deterministic by
//   design: both resolve 'unavailable' (no SDK exists that could mint a real
//   token, and fabricating one would fake a capability the app does not
//   have). Phase 1 builds therefore exercise the provider-unavailable state
//   for real — the state that needs UX until real credentials land.
// - Neither call ever rejects: a sign-in outcome is an answer, not an error
//   (the screen's state mapping depends on this; user cancellation is a
//   first-class outcome, never an exception).
//
// Determinism: no native modules, no timers, no network — pure JS.

describe('nativeSignIn.signInWithGoogle', () => {
  it("resolves 'unavailable' — the placeholder has no Google SDK to invoke", async () => {
    await expect(nativeSignIn.signInWithGoogle()).resolves.toEqual({ status: 'unavailable' });
  });
});

describe('nativeSignIn.signInWithApple', () => {
  it("resolves 'unavailable' — the placeholder has no Apple SDK to invoke", async () => {
    await expect(nativeSignIn.signInWithApple()).resolves.toEqual({ status: 'unavailable' });
  });
});

describe('determinism of the placeholder', () => {
  it('returns the same result on every call, in any interleaving', async () => {
    // Statelessness is a placeholder-specific property (a real SDK flow has
    // per-attempt outcomes); this case is replaced together with the
    // implementation when real provider SDKs land.
    await expect(nativeSignIn.signInWithGoogle()).resolves.toEqual({ status: 'unavailable' });
    await expect(nativeSignIn.signInWithApple()).resolves.toEqual({ status: 'unavailable' });
    await expect(nativeSignIn.signInWithGoogle()).resolves.toEqual({ status: 'unavailable' });
  });
});
