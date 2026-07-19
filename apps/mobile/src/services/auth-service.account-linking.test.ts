import { signInWithApple, signInWithGoogle } from './auth-service';

// Backlog: "Auth error states: … OAuth account-linking dialog". This suite
// extends the auth-service failure contract pinned in auth-service.test.ts
// (which stays untouched and green) with the identity-collision mapping the
// account-linking dialog keys off (ARCHITECTURE.md §2: "account-linking
// dialog (OAuth email collision)").
//
// PINNED ERROR CONTRACT (the decision this suite encodes):
// Supabase GoTrue rejects an ID-token sign-in that collides with an existing
// account with an AuthApiError carrying a machine-readable `code` (the
// supabase-js `AuthError.code` field; documented GoTrue error codes) —
// `email_exists`, `user_already_exists`, or `identity_already_exists`, HTTP
// status 422. The `message` text varies by server version and is diagnostic
// only (.claude/skills/supabase-integration/SKILL.md: never rendered), so the CODE, not the
// message and not the bare status, is the discriminator. auth-service
// normalizes any of these three codes on the ID-token exchange path into a
// third AuthFailure kind:
//
//   { kind: 'provider_email_conflict'; message; status? }
//
// so AuthScreen can branch on `kind` alone: 'provider_email_conflict' opens
// the account-linking dialog, 'auth_error' stays the generic typed failure,
// 'unexpected' stays the network/thrown bucket. A 422 WITHOUT a collision
// code (or any error without a code at all) must remain a plain 'auth_error'
// — over-matching would pop the linking dialog for unrelated rejections.
//
// Caveat, flagged per the placeholder-provider decision (CLAUDE.md): with
// placeholder Google/Apple config no real collision can be produced locally,
// so which exact code the live server emits per scenario is manual QA pending
// (docs/MANUAL_QA.md) — hence all three documented collision codes map, not a
// single guessed one.
//
// Harness mirrors auth-service.test.ts: the shared client module is mocked so
// no test touches the network (.claude/skills/testing-standards/SKILL.md determinism rule).

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

// AuthApiError shape: `code` is the machine-readable GoTrue error code
// (absent on older servers / non-API errors) — the collision discriminator.
interface AuthErrorStub {
  readonly code?: string;
  readonly message: string;
  readonly status?: number;
}

interface SessionResponseStub {
  readonly data: { readonly session: RawSessionStub | null; readonly user: RawUserStub | null };
  readonly error: AuthErrorStub | null;
}

const NO_SESSION_DATA = { session: null, user: null } as const;

const collisionResponse = (code: string, message: string): SessionResponseStub => ({
  data: NO_SESSION_DATA,
  error: { code, message, status: 422 },
});

const mockSignInWithIdToken = jest.fn<Promise<SessionResponseStub>, [unknown]>();

jest.mock('./supabase-client', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithIdToken: (params: unknown) => mockSignInWithIdToken(params),
    },
  }),
}));

beforeEach(() => {
  mockSignInWithIdToken.mockReset();
});

describe('ID-token exchange identity-collision mapping', () => {
  it("maps Google email_exists to 'provider_email_conflict', preserving diagnostics", async () => {
    mockSignInWithIdToken.mockResolvedValue(
      collisionResponse('email_exists', 'Email address already exists'),
    );

    const result = await signInWithGoogle({ idToken: 'google-id-token' });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'provider_email_conflict',
        message: 'Email address already exists',
        status: 422,
      },
    });
  });

  it("maps Google user_already_exists to 'provider_email_conflict'", async () => {
    mockSignInWithIdToken.mockResolvedValue(
      collisionResponse('user_already_exists', 'User already registered'),
    );

    const result = await signInWithGoogle({ idToken: 'google-id-token' });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'provider_email_conflict',
        message: 'User already registered',
        status: 422,
      },
    });
  });

  it("maps Apple identity_already_exists to 'provider_email_conflict'", async () => {
    // Same normalization on the Apple path — the dialog is provider-agnostic.
    mockSignInWithIdToken.mockResolvedValue(
      collisionResponse('identity_already_exists', 'Identity is already linked to a user'),
    );

    const result = await signInWithApple({ idToken: 'apple-identity-token' });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'provider_email_conflict',
        message: 'Identity is already linked to a user',
        status: 422,
      },
    });
  });

  it("keeps 'auth_error' for a 422 whose code is not a collision code", async () => {
    // Over-matching on the status alone would pop the account-linking dialog
    // for unrelated validation rejections.
    mockSignInWithIdToken.mockResolvedValue({
      data: NO_SESSION_DATA,
      error: { code: 'validation_failed', message: 'Bad payload', status: 422 },
    });

    const result = await signInWithGoogle({ idToken: 'google-id-token' });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'auth_error', message: 'Bad payload', status: 422 },
    });
  });

  it("keeps 'auth_error' for an error carrying no code at all", async () => {
    // Older servers / non-API errors omit `code` — without the discriminator
    // the failure stays generic, never a guessed conflict.
    mockSignInWithIdToken.mockResolvedValue({
      data: NO_SESSION_DATA,
      error: { message: 'Bad ID token', status: 400 },
    });

    const result = await signInWithGoogle({ idToken: 'google-id-token' });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'auth_error', message: 'Bad ID token', status: 400 },
    });
  });
});
