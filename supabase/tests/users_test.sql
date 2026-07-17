-- pgTAP test for public.users and its RLS policies.
-- Run with: supabase test db
--
-- STATUS: authored test-first (TDD). UNVERIFIED — requires Docker + Supabase CLI
-- (`supabase start` / `supabase test db`), which are not yet installed. Expect to
-- fix pgTAP function signatures and the auth.users seed against the real local DB
-- on first run; the *behavior* asserted here is the agreed contract.

begin;
select plan(11);

-- ── Schema shape ────────────────────────────────────────────────────
select has_table('public', 'users', 'public.users table exists');
select col_is_pk('public', 'users', 'id', 'id is the primary key');
select has_column('public', 'users', 'display_name', 'has display_name');
select col_not_null('public', 'users', 'display_name', 'display_name is NOT NULL');
select has_column('public', 'users', 'role', 'has role');
select col_has_check('public', 'users', 'role', 'role has a CHECK constraint (allowed set only)');

-- ── RLS is enabled ──────────────────────────────────────────────────
select is(
  (select relrowsecurity from pg_class where oid = 'public.users'::regclass),
  true,
  'row-level security is enabled on public.users'
);

-- ── Seed two auth users + profile rows (as service role, RLS bypassed) ──
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.dev');
insert into public.users (id, display_name, role) values
  ('11111111-1111-1111-1111-111111111111', 'User A', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'User B', 'user');

-- ── Act as User A (authenticated) ───────────────────────────────────
set local role authenticated;
set local "request.jwt.claims" to
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Decision 1: a user can read only their own row.
select is(
  (select count(*) from public.users
     where id = '11111111-1111-1111-1111-111111111111')::int,
  1, 'owner can read their own row');
select is(
  (select count(*) from public.users
     where id = '22222222-2222-2222-2222-222222222222')::int,
  0, 'user cannot read another user''s row');

-- Decision 2: a user can update their own editable fields (display_name).
update public.users set display_name = 'A2'
  where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select display_name from public.users
     where id = '11111111-1111-1111-1111-111111111111'),
  'A2', 'owner can update their own display_name');

-- Decision 3: a user CANNOT escalate their own role (privilege-escalation guard).
-- Enforced via column-level REVOKE UPDATE(role) FROM authenticated in the migration,
-- so the attempt raises a permission error rather than silently succeeding.
select throws_ok(
  $$ update public.users set role = 'admin'
       where id = '11111111-1111-1111-1111-111111111111' $$,
  NULL,
  'user cannot escalate their own role');

select * from finish();
rollback;
