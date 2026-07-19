// Native provider sign-in seam (Screen 3). The REAL flows are native SDKs
// (Google Sign-In; Sign in with Apple) that yield an ID token which
// auth-service exchanges via signInWithIdToken. No native SDK exists yet and
// provider config is placeholder-only (CLAUDE.md decision), so — exactly like
// blocking-permissions.ts for Screen 2 — this module is the seam: the screen
// codes against this surface only, and the future task that adds real SDKs
// swaps this module's internals without touching the screen. Contract pinned
// in native-sign-in.test.ts; the real credential flow is manual QA pending
// (docs/MANUAL_QA.md).

export type NativeSignInResult =
  | { readonly status: 'success'; readonly idToken: string; readonly nonce?: string }
  | { readonly status: 'cancelled' }
  | { readonly status: 'unavailable' };

export interface NativeSignInService {
  readonly signInWithApple: () => Promise<NativeSignInResult>;
  readonly signInWithGoogle: () => Promise<NativeSignInResult>;
}

// Phase 1 placeholder: no SDK exists that could mint a real token, and
// fabricating one would fake a capability the app does not have — both
// providers deterministically report 'unavailable' (the state that needs UX
// until real credentials land). Never rejects: a sign-in outcome is an
// answer, not an error.
export const nativeSignIn: NativeSignInService = {
  signInWithApple: () => Promise.resolve({ status: 'unavailable' }),
  signInWithGoogle: () => Promise.resolve({ status: 'unavailable' }),
};
