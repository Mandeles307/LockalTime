/**
 * @jest-environment node
 */
import { createClient, type Session } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../src/config/supabase-config';

// Real end-to-end email OTP signup against the LOCAL Supabase stack — the
// graduation of the docs/MANUAL_QA.md entry promised when auth wiring landed.
// This is the one place the links no unit suite can pin are exercised for
// real: GoTrue actually sending the OTP email, supabase-js emitting SIGNED_IN
// from its own verifyOtp (App.auth-gate.spec.tsx re-emits it synthetically),
// and the handle_new_user trigger creating the public.users row for an
// OTP signup (pgTAP covers it at the SQL level; this covers it through the
// real auth API).
//
// NOT part of the default `npm test` run (jest.config.js ignores
// integration/): run via `npm run test:integration` with the local stack up
// (`npx supabase start`, full stack — Mailpit included). CI runs it in the db
// job. Fails fast with a clear message when the stack is unreachable — never
// skips silently (.claude/skills/testing-standards/SKILL.md).
//
// Each run signs up a fresh timestamped address, so reruns don't collide and
// the [auth.rate_limit] email_sent budget (bumped for local dev in
// supabase/config.toml) is spent one email per run. Created users persist in
// the local stack only; `npx supabase db reset` clears them.

const MAILPIT_URL = 'http://127.0.0.1:54324';
const OTP_PATTERN = /\b(\d{6})\b/;
const MAILPIT_POLL_ATTEMPTS = 20;
const MAILPIT_POLL_INTERVAL_MS = 500;

jest.setTimeout(60000);

interface MailpitAddress {
  readonly Address: string;
}

interface MailpitMessageSummary {
  readonly ID: string;
  readonly To: readonly MailpitAddress[];
}

interface MailpitMessageList {
  readonly messages: readonly MailpitMessageSummary[];
}

interface MailpitMessageDetail {
  readonly Text: string;
}

const isMailpitMessageList = (value: unknown): value is MailpitMessageList =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as { messages?: unknown }).messages);

const isMailpitMessageDetail = (value: unknown): value is MailpitMessageDetail =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { Text?: unknown }).Text === 'string';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }
  return response.json() as Promise<unknown>;
};

// Polls Mailpit for the newest message addressed to `email` and extracts the
// 6-digit code from its text body.
const readOtpFromMailpit = async (email: string): Promise<string> => {
  for (let attempt = 0; attempt < MAILPIT_POLL_ATTEMPTS; attempt += 1) {
    const list = await fetchJson(`${MAILPIT_URL}/api/v1/messages`);
    if (!isMailpitMessageList(list)) {
      throw new Error('Mailpit /api/v1/messages returned an unexpected shape');
    }
    const match = list.messages.find((message) =>
      message.To.some((to) => to.Address.toLowerCase() === email.toLowerCase()),
    );
    if (match !== undefined) {
      const detail = await fetchJson(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      if (!isMailpitMessageDetail(detail)) {
        throw new Error(`Mailpit message ${match.ID} returned an unexpected shape`);
      }
      const code = OTP_PATTERN.exec(detail.Text)?.[1];
      if (code === undefined) {
        throw new Error(`no 6-digit OTP found in the email sent to ${email}`);
      }
      return code;
    }
    await sleep(MAILPIT_POLL_INTERVAL_MS);
  }
  throw new Error(
    `no OTP email for ${email} arrived in Mailpit within ` +
      `${(MAILPIT_POLL_ATTEMPTS * MAILPIT_POLL_INTERVAL_MS) / 1000}s`,
  );
};

// Fail fast (never skip) when the local stack is down: every later failure
// would otherwise be a confusing timeout instead of the actual problem.
beforeAll(async () => {
  const failures: string[] = [];
  try {
    const health = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (!health.ok) {
      failures.push(`GoTrue health check responded ${health.status}`);
    }
  } catch {
    failures.push(`Supabase API unreachable at ${SUPABASE_URL}`);
  }
  try {
    const mailpit = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    if (!mailpit.ok) {
      failures.push(`Mailpit responded ${mailpit.status}`);
    }
  } catch {
    failures.push(`Mailpit unreachable at ${MAILPIT_URL}`);
  }
  if (failures.length > 0) {
    throw new Error(
      `local Supabase stack is not running (${failures.join('; ')}) — ` +
        'start it with `npx supabase start` (full stack, Mailpit included)',
    );
  }
});

describe('email OTP signup against the local stack', () => {
  it('requests a code, verifies it, emits SIGNED_IN, and auto-creates the users profile row', async () => {
    // Node environment: in-memory session storage — this client is the
    // app's client contract (same URL/anon key) without React Native storage.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const email = `otp-int-${Date.now()}@integration.test`;
    const localPart = email.split('@')[0];

    const signedInSessions: Session[] = [];
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session !== null) {
        signedInSessions.push(session);
      }
    });

    try {
      const requested = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      expect(requested.error).toBeNull();

      const code = await readOtpFromMailpit(email);

      const verified = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      expect(verified.error).toBeNull();
      const session = verified.data.session;
      if (session === null) {
        throw new Error('verifyOtp succeeded but returned no session');
      }
      expect(session.user.email).toBe(email);

      // The link App.auth-gate.spec.tsx can only re-emit synthetically:
      // supabase-js itself fires SIGNED_IN from a successful verifyOtp.
      expect(signedInSessions.length).toBeGreaterThanOrEqual(1);

      // handle_new_user trigger, observed through the real auth API + RLS:
      // the authenticated user reads their own auto-created profile row.
      const profile = await supabase
        .from('users')
        .select('id, display_name, role')
        .eq('id', session.user.id)
        .single();
      expect(profile.error).toBeNull();
      expect(profile.data).toEqual({
        id: session.user.id,
        display_name: localPart,
        role: 'user',
      });
    } finally {
      listener.subscription.unsubscribe();
      await supabase.auth.signOut();
    }
  });
});
