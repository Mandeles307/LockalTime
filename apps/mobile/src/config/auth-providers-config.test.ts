import { readFileSync } from 'fs';
import { resolve } from 'path';

// Phase 1 auth wiring, provider-config contract: supabase/config.toml must
// keep email OTP signup enabled and declare Google + Apple external-provider
// blocks against PLACEHOLDER credentials (per the CLAUDE.md decision — real
// credentials are manual QA pending). This is a cheap textual contract test,
// not a TOML parser: it reads the committed config and asserts the exact
// key = value lines inside each section, so a drive-by edit that disables a
// provider or the local OTP flow fails the mobile suite. It reads a repo
// file, never the network — determinism rule, skills/testing-standards.md.

const CONFIG_PATH = resolve(__dirname, '..', '..', '..', '..', 'supabase', 'config.toml');

const configToml = readFileSync(CONFIG_PATH, 'utf8');

// Returns the body of a top-level TOML section (lines between its header and
// the next section header), or null when the section is absent.
const readSection = (header: string): string | null => {
  const lines = configToml.split(/\r?\n/);
  const start = lines.indexOf(header);
  if (start === -1) {
    return null;
  }
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('[')) {
      break;
    }
    body.push(line);
  }
  return body.join('\n');
};

const requireSection = (header: string): string => {
  const section = readSection(header);
  if (section === null) {
    throw new Error(`missing ${header} section in supabase/config.toml`);
  }
  return section;
};

describe('supabase/config.toml auth providers', () => {
  it('keeps email OTP signup enabled with a 6-digit code', () => {
    const section = requireSection('[auth.email]');

    expect(section).toMatch(/^enable_signup = true$/m);
    // The OTP-entry UI (later backlog item) renders a 6-digit code input.
    expect(section).toMatch(/^otp_length = 6$/m);
  });

  it('keeps the local mail testing server enabled so OTP emails are inspectable in dev', () => {
    const section = requireSection('[local_smtp]');

    expect(section).toMatch(/^enabled = true$/m);
  });

  it('declares Google with a placeholder client id (manual QA pending: real credentials)', () => {
    const section = requireSection('[auth.external.google]');

    expect(section).toMatch(/^enabled = true$/m);
    expect(section).toMatch(/^client_id = "[^"]+"/m);
    // Required for local sign-in with Google per the Supabase CLI config docs.
    expect(section).toMatch(/^skip_nonce_check = true$/m);
  });

  it('declares Apple with a placeholder client id (manual QA pending: real credentials)', () => {
    const section = requireSection('[auth.external.apple]');

    expect(section).toMatch(/^enabled = true$/m);
    expect(section).toMatch(/^client_id = "[^"]+"/m);
  });
});
