import type { Session, SignInWithIdTokenCredentials } from '@supabase/supabase-js';

import { getSupabaseClient } from './supabase-client';

// Phase 1 auth service: the app's only entry points into Supabase Auth.
// Email is the passwordless OTP flow (request + verify); Google/Apple
// exchange a native-SDK-issued ID token. Provider config is placeholder-only
// until real credentials exist — manual QA pending (CLAUDE.md decision, see
// docs/MANUAL_QA.md). Every function returns a discriminated AuthResult and
// never throws; AuthFailure.message is diagnostic text for logs, never
// rendered directly — screens map failures to i18n keys (later backlog item).

export interface AuthUser {
  readonly email: string | null;
  readonly id: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: AuthUser;
}

export interface AuthFailure {
  readonly kind: 'auth_error' | 'unexpected';
  readonly message: string;
  readonly status?: number;
}

export type AuthResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AuthFailure };

export interface GoogleSignInParams {
  readonly idToken: string;
}

export interface AppleSignInParams {
  readonly idToken: string;
  readonly nonce?: string;
}

// Maps a Supabase session to the app's typed shape. accessToken is what
// future Node API calls send as the bearer credential (ARCHITECTURE.md §3).
export const toAuthSession = (session: Session): AuthSession => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
  user: { email: session.user.email ?? null, id: session.user.id },
});

const authFailure = (message: string, status: number | undefined): AuthFailure =>
  // Built conditionally: exactOptionalPropertyTypes forbids an explicit
  // `status: undefined` on the optional property.
  status === undefined ? { kind: 'auth_error', message } : { kind: 'auth_error', message, status };

const unexpectedFailure = (thrown: unknown): AuthFailure => {
  if (thrown instanceof Error) {
    return { kind: 'unexpected', message: thrown.message };
  }
  if (typeof thrown === 'string') {
    return { kind: 'unexpected', message: thrown };
  }
  return { kind: 'unexpected', message: 'Unknown auth failure' };
};

const exchangeIdToken = async (
  credentials: SignInWithIdTokenCredentials,
): Promise<AuthResult<AuthSession>> => {
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithIdToken(credentials);
    if (error !== null) {
      return { ok: false, error: authFailure(error.message, error.status) };
    }
    if (data.session === null) {
      return {
        ok: false,
        error: { kind: 'unexpected', message: 'Sign-in succeeded but returned no session' },
      };
    }
    return { ok: true, value: toAuthSession(data.session) };
  } catch (thrown) {
    return { ok: false, error: unexpectedFailure(thrown) };
  }
};

// shouldCreateUser: signup and sign-in share one passwordless flow — a new
// email gets an account, an existing one gets a login code (Phase 1 DoD).
export const requestEmailOtp = async (email: string): Promise<AuthResult<null>> => {
  try {
    const { error } = await getSupabaseClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error !== null) {
      return { ok: false, error: authFailure(error.message, error.status) };
    }
    return { ok: true, value: null };
  } catch (thrown) {
    return { ok: false, error: unexpectedFailure(thrown) };
  }
};

export const verifyEmailOtp = async (
  email: string,
  code: string,
): Promise<AuthResult<AuthSession>> => {
  try {
    const { data, error } = await getSupabaseClient().auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error !== null) {
      return { ok: false, error: authFailure(error.message, error.status) };
    }
    if (data.session === null) {
      return {
        ok: false,
        error: { kind: 'unexpected', message: 'OTP verified but returned no session' },
      };
    }
    return { ok: true, value: toAuthSession(data.session) };
  } catch (thrown) {
    return { ok: false, error: unexpectedFailure(thrown) };
  }
};

// Manual QA pending: real Google credentials + native sign-in SDK.
export const signInWithGoogle = async (
  params: GoogleSignInParams,
): Promise<AuthResult<AuthSession>> => exchangeIdToken({ provider: 'google', token: params.idToken });

// Manual QA pending: real Apple credentials + a Mac/device for Sign in with
// Apple. The nonce is omitted (not passed as undefined) when absent.
export const signInWithApple = async (
  params: AppleSignInParams,
): Promise<AuthResult<AuthSession>> =>
  exchangeIdToken(
    params.nonce === undefined
      ? { provider: 'apple', token: params.idToken }
      : { provider: 'apple', token: params.idToken, nonce: params.nonce },
  );

export const signOut = async (): Promise<AuthResult<null>> => {
  try {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error !== null) {
      return { ok: false, error: authFailure(error.message, error.status) };
    }
    return { ok: true, value: null };
  } catch (thrown) {
    return { ok: false, error: unexpectedFailure(thrown) };
  }
};
