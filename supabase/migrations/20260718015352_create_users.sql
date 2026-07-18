-- public.users: profile row extending Supabase auth.users.
-- Test-first contract: supabase/tests/users_test.sql (pgTAP, run via `supabase test db`).

create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  avatar_url      text,
  role            text not null default 'user'
                    check (role in ('user', 'verified_host', 'admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users can read their own row"
  on public.users for select
  using (id = auth.uid());

create policy "users can update their own row"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- New tables carry no DML privileges for `authenticated` by default (only
-- REFERENCES/TRIGGER/TRUNCATE) — RLS policies alone are not enough, the grant
-- itself must exist. SELECT is granted table-wide; UPDATE is granted only on the
-- columns a user may edit, so `role` has no update path at all (no table-wide grant
-- exists to fall back on) and a self-escalation attempt throws a permission error.
grant select on public.users to authenticated;
grant update (display_name, avatar_url) on public.users to authenticated;
