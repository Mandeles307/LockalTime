import { attachAuthStateListener, useAuthStore } from './auth-store';

// Phase 1 auth state store, mirroring the Zustand pattern proven in
// app-store.ts. Auth state is a discriminated union (unauthenticated |
// authenticated + session) per .claude/skills/typescript-strictness/SKILL.md — never a bag
// of booleans, and a cleared store cannot carry a stale session.
//
// attachAuthStateListener is the wiring between the shared Supabase client
// and the store: it subscribes to auth.onAuthStateChange and is the only
// client-driven writer of auth state. The client module is mocked (virtually
// — it does not exist until Stage B); no test touches the network.

interface RawUserStub {
  readonly email?: string;
  readonly id: string;
}

interface RawSessionStub {
  readonly access_token: string;
  readonly expires_in: number;
  readonly refresh_token: string;
  readonly token_type: 'bearer';
  readonly user: RawUserStub;
}

type AuthChangeCallbackStub = (event: string, session: RawSessionStub | null) => void;

interface OnAuthStateChangeReturnStub {
  readonly data: { readonly subscription: { readonly unsubscribe: () => void } };
}

const USER_ID = '5f0c3a52-7c46-4c1f-9d0e-2a9346f2b70e';

const RAW_SESSION_A: RawSessionStub = {
  access_token: 'access-a',
  expires_in: 3600,
  refresh_token: 'refresh-a',
  token_type: 'bearer',
  user: { email: 'dana@example.com', id: USER_ID },
};

// Same user, rotated tokens — what a TOKEN_REFRESHED event delivers.
const RAW_SESSION_B: RawSessionStub = {
  ...RAW_SESSION_A,
  access_token: 'access-b',
  refresh_token: 'refresh-b',
};

const MAPPED_SESSION_A = {
  accessToken: 'access-a',
  refreshToken: 'refresh-a',
  user: { email: 'dana@example.com', id: USER_ID },
};

const MAPPED_SESSION_B = {
  accessToken: 'access-b',
  refreshToken: 'refresh-b',
  user: { email: 'dana@example.com', id: USER_ID },
};

const mockUnsubscribe = jest.fn<void, []>();
let capturedCallback: AuthChangeCallbackStub | undefined;

const mockOnAuthStateChange = jest.fn<OnAuthStateChangeReturnStub, [AuthChangeCallbackStub]>(
  (callback) => {
    capturedCallback = callback;
    return { data: { subscription: { unsubscribe: () => mockUnsubscribe() } } };
  },
);

// Not a virtual mock: the module exists since the auth wiring landed, and a
// virtual mock of an existing module resolves unreliably across shared jest
// workers (observed: the real module loads and drags untranspiled ESM in).
jest.mock('../services/supabase-client', () => ({
  getSupabaseClient: () => ({
    auth: {
      onAuthStateChange: (callback: AuthChangeCallbackStub) => mockOnAuthStateChange(callback),
    },
  }),
}));

const emitAuthEvent = (event: string, session: RawSessionStub | null): void => {
  if (capturedCallback === undefined) {
    throw new Error('attachAuthStateListener has not registered a callback');
  }
  capturedCallback(event, session);
};

beforeEach(() => {
  capturedCallback = undefined;
  mockOnAuthStateChange.mockClear();
  mockUnsubscribe.mockClear();
  useAuthStore.setState({ auth: { status: 'unauthenticated' } });
});

describe('useAuthStore', () => {
  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().auth).toEqual({ status: 'unauthenticated' });
  });

  it('flips to authenticated with the typed session when a session is set', () => {
    useAuthStore.getState().setSession(MAPPED_SESSION_A);

    expect(useAuthStore.getState().auth).toEqual({
      status: 'authenticated',
      session: MAPPED_SESSION_A,
    });
  });

  it('returns to unauthenticated on clearSession, carrying no stale session', () => {
    useAuthStore.getState().setSession(MAPPED_SESSION_A);

    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().auth).toEqual({ status: 'unauthenticated' });
  });

  it('notifies subscribers on auth transitions', () => {
    const listener = jest.fn();
    const unsubscribe = useAuthStore.subscribe(listener);

    useAuthStore.getState().setSession(MAPPED_SESSION_A);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe('attachAuthStateListener', () => {
  it('registers a single listener on the shared client', () => {
    attachAuthStateListener();

    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('authenticates the store when Supabase reports SIGNED_IN', () => {
    attachAuthStateListener();

    emitAuthEvent('SIGNED_IN', RAW_SESSION_A);

    expect(useAuthStore.getState().auth).toEqual({
      status: 'authenticated',
      session: MAPPED_SESSION_A,
    });
  });

  it('hydrates a persisted session on INITIAL_SESSION', () => {
    // Cold start with a session restored from AsyncStorage by supabase-js.
    attachAuthStateListener();

    emitAuthEvent('INITIAL_SESSION', RAW_SESSION_A);

    expect(useAuthStore.getState().auth).toEqual({
      status: 'authenticated',
      session: MAPPED_SESSION_A,
    });
  });

  it('stays unauthenticated when INITIAL_SESSION carries no session', () => {
    attachAuthStateListener();

    emitAuthEvent('INITIAL_SESSION', null);

    expect(useAuthStore.getState().auth).toEqual({ status: 'unauthenticated' });
  });

  it('replaces the session tokens on TOKEN_REFRESHED', () => {
    attachAuthStateListener();
    emitAuthEvent('SIGNED_IN', RAW_SESSION_A);

    emitAuthEvent('TOKEN_REFRESHED', RAW_SESSION_B);

    expect(useAuthStore.getState().auth).toEqual({
      status: 'authenticated',
      session: MAPPED_SESSION_B,
    });
  });

  it('clears to unauthenticated on SIGNED_OUT', () => {
    attachAuthStateListener();
    emitAuthEvent('SIGNED_IN', RAW_SESSION_A);

    emitAuthEvent('SIGNED_OUT', null);

    expect(useAuthStore.getState().auth).toEqual({ status: 'unauthenticated' });
  });

  it('detaching unsubscribes the underlying Supabase subscription', () => {
    const detach = attachAuthStateListener();

    detach();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
