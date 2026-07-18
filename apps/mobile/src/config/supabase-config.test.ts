import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config';

// Phase 1 auth wiring: the mobile app gets exactly one typed config module for
// Supabase connection values. The local stack's demo URL + anon key are
// standard public values, safe to commit for dev. The contract pinned here is
// a trust-boundary guard from skills/supabase-integration.md: the mobile app
// ships the ANON key only — the service-role key must never reach a client.

// Decodes a JWT payload for inspection. Test-only helper: it does not verify
// the signature, it just reads the claims so we can assert the key's role.
const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const segments = token.split('.');
  const payloadSegment = segments[1];
  if (segments.length !== 3 || payloadSegment === undefined) {
    throw new Error('SUPABASE_ANON_KEY is not a three-segment JWT');
  }
  const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(base64, 'base64').toString('utf8');
  const parsed: unknown = JSON.parse(json);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JWT payload is not an object');
  }
  // Narrowed to a non-null, non-array object by the checks above.
  return parsed as Record<string, unknown>;
};

describe('supabase config', () => {
  it('exposes a well-formed http(s) Supabase URL', () => {
    const url = new URL(SUPABASE_URL);

    expect(['http:', 'https:']).toContain(url.protocol);
  });

  it('ships a key whose JWT role is anon — never service_role', () => {
    const payload = decodeJwtPayload(SUPABASE_ANON_KEY);

    expect(payload.role).toBe('anon');
  });
});
