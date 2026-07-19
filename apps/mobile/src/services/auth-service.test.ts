import {
  requestEmailOtp,
  signInWithApple,
  signInWithGoogle,
  signOut,
  verifyEmailOtp,
} from './auth-service';

// Phase 1 auth wiring (backlog: "Supabase Auth wiring: email first (fully
// tested); Google + Apple wired against placeholder config"). Contract:
//
// - Email is the passwordless OTP flow: requestEmailOtp → signInWithOtp with
//   shouldCreateUser (signup and sign-in share one flow, matching the Phase 1
//   DoD "new user can sign up"); verifyEmailOtp → verifyOtp type 'email'.
// - Google/Apple entry points exchange a native-SDK-issued ID token via
//   signInWithIdToken. No native sign-in SDK exists yet and provider config is
//   placeholder-only, so these tests pin the call contract only; the real
//   credential flow is manual QA pending (per CLAUDE.md decision).
// - Every function returns a discriminated AuthResult — never throws, no
//   `any`, unknown rejections narrowed (.claude/skills/typescript-strictness/SKILL.md).
//   AuthFailure.message is diagnostic text for logs/debugging, never rendered
//   directly; the auth-error-states backlog item maps failures to i18n keys.
//
// The service must go through the shared client module (getSupabaseClient) —
// the module is mocked here (virtually; it does not exist until Stage B), so
// an implementation constructing its own client fails these tests. No test
// touches the network; determinism rule, .claude/skills/testing-standards/SKILL.md.

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

interface AuthErrorStub {
  readonly message: string;
  readonly status?: number;
}

interface SessionResponseStub {
  readonly data: { readonly session: RawSessionStub | null; readonly user: RawUserStub | null };
  readonly error: AuthErrorStub | null;
}

interface OtpRequestResponseStub {
  readonly data: { readonly session: null; readonly user: null };
  readonly error: AuthErrorStub | null;
}

interface SignOutResponseStub {
  readonly error: AuthErrorStub | null;
}

const USER_ID = '5f0c3a52-7c46-4c1f-9d0e-2a9346f2b70e';

const RAW_SESSION: RawSessionStub = {
  access_token: 'access-token-1',
  expires_in: 3600,
  refresh_token: 'refresh-token-1',
  token_type: 'bearer',
  user: { email: 'dana@example.com', id: USER_ID },
};

// The typed shape the rest of the app consumes. accessToken is what future
// Node API calls send as the bearer credential (docs/ARCHITECTURE.md §3).
const EXPECTED_SESSION = {
  accessToken: 'access-token-1',
  refreshToken: 'refresh-token-1',
  user: { email: 'dana@example.com', id: USER_ID },
};

const OK_OTP_RESPONSE: OtpRequestResponseStub = {
  data: { session: null, user: null },
  error: null,
};

const OK_SESSION_RESPONSE: SessionResponseStub = {
  data: { session: RAW_SESSION, user: RAW_SESSION.user },
  error: null,
};

const mockSignInWithOtp = jest.fn<Promise<OtpRequestResponseStub>, [unknown]>();
const mockVerifyOtp = jest.fn<Promise<SessionResponseStub>, [unknown]>();
const mockSignInWithIdToken = jest.fn<Promise<SessionResponseStub>, [unknown]>();
const mockSignOut = jest.fn<Promise<SignOutResponseStub>, []>();

jest.mock(
  './supabase-client',
  () => ({
    getSupabaseClient: () => ({
      auth: {
        signInWithIdToken: (params: unknown) => mockSignInWithIdToken(params),
        signInWithOtp: (params: unknown) => mockSignInWithOtp(params),
        signOut: () => mockSignOut(),
        verifyOtp: (params: unknown) => mockVerifyOtp(params),
      },
    }),
  }),
  { virtual: true },
);

beforeEach(() => {
  mockSignInWithOtp.mockReset();
  mockVerifyOtp.mockReset();
  mockSignInWithIdToken.mockReset();
  mockSignOut.mockReset();
  mockSignInWithOtp.mockResolvedValue(OK_OTP_RESPONSE);
  mockVerifyOtp.mockResolvedValue(OK_SESSION_RESPONSE);
  mockSignInWithIdToken.mockResolvedValue(OK_SESSION_RESPONSE);
  mockSignOut.mockResolvedValue({ error: null });
});

describe('requestEmailOtp', () => {
  it('sends the code via signInWithOtp with shouldCreateUser, so signup and sign-in share one flow', async () => {
    const result = await requestEmailOtp('dana@example.com');

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'dana@example.com',
      options: { shouldCreateUser: true },
    });
    expect(result).toEqual({ ok: true, value: null });
  });

  it('returns a typed failure when Supabase rejects the OTP request', async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'over_email_send_rate_limit', status: 429 },
    });

    const result = await requestEmailOtp('dana@example.com');

    expect(result).toEqual({
      ok: false,
      error: { kind: 'auth_error', message: 'over_email_send_rate_limit', status: 429 },
    });
  });

  it('normalizes a thrown non-Error rejection into a typed failure', async () => {
    mockSignInWithOtp.mockRejectedValue('socket hang up');

    const result = await requestEmailOtp('dana@example.com');

    expect(result).toEqual({
      ok: false,
      error: { kind: 'unexpected', message: 'socket hang up' },
    });
  });
});

describe('verifyEmailOtp', () => {
  it("verifies the code with type 'email' and returns the typed session", async () => {
    const result = await verifyEmailOtp('dana@example.com', '123456');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'dana@example.com',
      token: '123456',
      type: 'email',
    });
    expect(result).toEqual({ ok: true, value: EXPECTED_SESSION });
  });

  it('maps a user without an email address to a null email', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { ...RAW_SESSION, user: { id: USER_ID } },
        user: { id: USER_ID },
      },
      error: null,
    });

    const result = await verifyEmailOtp('dana@example.com', '123456');

    expect(result).toEqual({
      ok: true,
      value: { ...EXPECTED_SESSION, user: { email: null, id: USER_ID } },
    });
  });

  it('returns a typed failure for a wrong or expired code', async () => {
    // The dedicated wrong-OTP error screen is a later backlog item; this pins
    // the failure contract that screen will consume.
    mockVerifyOtp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Token has expired or is invalid', status: 403 },
    });

    const result = await verifyEmailOtp('dana@example.com', '000000');

    expect(result).toEqual({
      ok: false,
      error: { kind: 'auth_error', message: 'Token has expired or is invalid', status: 403 },
    });
  });

  it('treats a success response with no session as a failure rather than a crash', async () => {
    mockVerifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: null });

    const result = await verifyEmailOtp('dana@example.com', '123456');

    expect(result).toEqual({
      ok: false,
      error: { kind: 'unexpected', message: expect.any(String) },
    });
  });
});

describe('signInWithGoogle', () => {
  // Placeholder-config path: real credential flow is manual QA pending until
  // Google OAuth credentials and the native sign-in SDK exist.
  it('exchanges a Google ID token via signInWithIdToken', async () => {
    const result = await signInWithGoogle({ idToken: 'google-id-token' });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-id-token',
    });
    expect(result).toEqual({ ok: true, value: EXPECTED_SESSION });
  });

  it('returns a typed failure when the Google token is rejected', async () => {
    mockSignInWithIdToken.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Bad ID token', status: 400 },
    });

    const result = await signInWithGoogle({ idToken: 'google-id-token' });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'auth_error', message: 'Bad ID token', status: 400 },
    });
  });
});

describe('signInWithApple', () => {
  // Placeholder-config path: real credential flow is manual QA pending until
  // Apple credentials exist (and a Mac/device to run Sign in with Apple).
  it('exchanges an Apple identity token and nonce via signInWithIdToken', async () => {
    const result = await signInWithApple({ idToken: 'apple-identity-token', nonce: 'raw-nonce' });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'apple-identity-token',
      nonce: 'raw-nonce',
    });
    expect(result).toEqual({ ok: true, value: EXPECTED_SESSION });
  });

  it('omits the nonce when the native layer does not supply one', async () => {
    await signInWithApple({ idToken: 'apple-identity-token' });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'apple-identity-token',
    });
  });
});

describe('signOut', () => {
  it('signs out through the shared client', async () => {
    const result = await signOut();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, value: null });
  });

  it('returns a typed failure when sign-out fails', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'session missing', status: 403 } });

    const result = await signOut();

    expect(result).toEqual({
      ok: false,
      error: { kind: 'auth_error', message: 'session missing', status: 403 },
    });
  });
});
