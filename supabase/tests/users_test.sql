-- pgTAP test for public.users and its RLS policies.
-- Run with: supabase test db
--
-- STATUS: verified — 12/12 passing via `supabase test db` against local, migration
-- applied to both local and the linked production project.

begin;
select plan(12);

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

-- ── Seed two auth users (as service role, RLS bypassed) ─────────────
-- The on_auth_user_created trigger (users_trigger_test.sql) auto-creates the
-- public.users profile rows, so no manual profile insert — it would now hit a
-- duplicate key. Assertions below never depend on the seeded display_name.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.dev');

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

-- Decision 2: a user can update their own editable fields (display_name, avatar_url).
update public.users set display_name = 'A2'
  where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select display_name from public.users
     where id = '11111111-1111-1111-1111-111111111111'),
  'A2', 'owner can update their own display_name');

update public.users set avatar_url = 'https://example.dev/a2.png'
  where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select avatar_url from public.users
     where id = '11111111-1111-1111-1111-111111111111'),
  'https://example.dev/a2.png', 'owner can update their own avatar_url');

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
