import { create } from 'zustand';

import type { AuthSession } from '../services/auth-service';
import { toAuthSession } from '../services/auth-service';
import { getSupabaseClient } from '../services/supabase-client';

// Phase 1 auth state, mirroring the Zustand pattern proven in app-store.ts.
// Auth is a discriminated union (skills/typescript-strictness.md) so a
// cleared store cannot carry a stale session.

export type AuthStatus =
  | { readonly status: 'authenticated'; readonly session: AuthSession }
  | { readonly status: 'unauthenticated' };

interface AuthState {
  auth: AuthStatus;
  clearSession: () => void;
  setSession: (session: AuthSession) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: { status: 'unauthenticated' },
  clearSession: (): void => {
    set({ auth: { status: 'unauthenticated' } });
  },
  setSession: (session: AuthSession): void => {
    set({ auth: { status: 'authenticated', session } });
  },
}));

// The only client-driven writer of auth state: subscribes to the shared
// client's auth events (SIGNED_IN, INITIAL_SESSION cold-start hydration from
// AsyncStorage, TOKEN_REFRESHED rotation, SIGNED_OUT). Lives beside the store
// rather than as its own module because store + listener form one wiring
// unit — nothing else may write auth state. Returns a detach function; the
// App bootstrap owns attach/detach (see App.tsx).
export const attachAuthStateListener = (): (() => void) => {
  const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
    if (session !== null) {
      useAuthStore.getState().setSession(toAuthSession(session));
      return;
    }
    // Only an explicit sign-out clears the store: sessionless events like
    // INITIAL_SESSION on a cold start without a persisted session (or
    // PASSWORD_RECOVERY-style notifications) must not clobber auth state.
    if (event === 'SIGNED_OUT') {
      useAuthStore.getState().clearSession();
    }
  });
  return (): void => {
    data.subscription.unsubscribe();
  };
};
