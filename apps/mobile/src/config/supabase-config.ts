// Supabase connection values for the mobile app. These are the Supabase CLI's
// standard local-development demo values — public by design and safe to
// commit; real per-environment config arrives with the staging setup
// (Phase 7 decision in CLAUDE.md). Only the ANON key may ever appear here:
// the service-role key stays server-side (.claude/skills/supabase-integration/SKILL.md),
// which supabase-config.test.ts enforces by asserting this key's JWT role.
export const SUPABASE_URL = 'http://127.0.0.1:54321';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
