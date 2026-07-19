# Lockal Time — Database Schema

Status: planning blueprint, except `users` — implemented (`supabase/migrations/20260718015352_create_users.sql`), migrated to both local and production (`LockalTime`), pgTAP-verified (`supabase/tests/users_test.sql`). The signup trigger (`supabase/migrations/20260718192504_create_users_signup_trigger.sql`) is implemented and pgTAP-verified locally (`supabase/tests/users_trigger_test.sql`); production push pending (done manually by the user per `CLAUDE.md`). This is the consolidated, final-for-now schema reflecting every decision made during architecture planning. Update this file whenever a migration changes the shape of the data — `supabase/migrations/` is the executable source of truth, this file is the human-readable explanation of *why* it looks the way it does.

Note on RLS in production: a table's RLS policies alone don't grant access — Postgres privileges (`GRANT`) must exist too, and new tables get none by default for `anon`/`authenticated`. See `.claude/skills/supabase-integration/SKILL.md` for the pattern (table-wide `SELECT`, column-scoped `UPDATE` to exclude fields like `role`).

## Design Principles

- Money-equivalent fields (points, bonuses, QR tokens) are only ever written by the Node.js API, never directly by a client under RLS.
- Presence/liveness (`session_presence_intervals`) is stored durably in Postgres, *not* left to Supabase Realtime Presence alone, because the Group/Completion Bonus algorithms need to replay exact join/leave history after the fact — Presence is ephemeral and only good for live host-migration detection, not for bonus math.
- No geolocation is collected anywhere in this schema. `venues` is a display label only.

## Schema

```sql
create extension if not exists pgcrypto;

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  avatar_url      text,
  role            text not null default 'user'
                    check (role in ('user', 'verified_host', 'admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Signup trigger: GoTrue inserts into auth.users on signup for all three
-- providers (email OTP, Google/Apple via signInWithIdToken), so an AFTER
-- INSERT trigger there is the single choke point that guarantees a profile
-- row always exists. display_name derivation, first non-empty wins:
--   raw_user_meta_data->>'full_name'  (Google/Apple id-token shape)
--   → raw_user_meta_data->>'name'     (variant key some providers use)
--   → email local-part                (email OTP carries no name metadata;
--                                      user-editable later via the
--                                      column-scoped UPDATE grant)
--   → 'user'                          (final guard — display_name is NOT NULL
--                                      and must never abort the auth insert)
-- SECURITY DEFINER (owner postgres) because the insert runs under
-- supabase_auth_admin, which has no privileges on public.users; search_path
-- is pinned to '' so the definer function can't be hijacked. ON CONFLICT (id)
-- DO NOTHING so a pre-existing profile row never errors the signup itself.
create function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = '' ...;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- VENUES (display label for static/business QR — no geolocation)
-- ============================================================
create table public.venues (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.users(id),
  name            text not null,
  address_label   text,        -- free-text display only, never geocoded
  created_at      timestamptz not null default now()
);

-- ============================================================
-- SESSIONS
-- ============================================================
create table public.sessions (
  id                       uuid primary key default gen_random_uuid(),
  host_id                  uuid not null references public.users(id),
  venue_id                 uuid references public.venues(id),
  type                     text not null
                             check (type in ('solo', 'dynamic_qr', 'static_qr')),
  status                   text not null default 'pending'
                             check (status in ('pending', 'active', 'completed', 'cancelled')),
  duration_mode            text not null default 'fixed'
                             check (duration_mode in ('fixed', 'open_ended')),
  planned_duration_minutes int check (planned_duration_minutes > 0),
  actual_duration_minutes  int,
  qr_token                 text unique,          -- signed by Node, null for solo
  qr_expires_at            timestamptz,
  started_at               timestamptz,
  ended_at                 timestamptz,
  ended_by                 uuid references public.users(id),
  end_reason               text
                             check (end_reason in ('host_ended', 'planned_duration_reached')),
  created_at               timestamptz not null default now(),

  constraint chk_dynamic_qr_has_token
    check (type = 'solo' or qr_token is not null),
  constraint chk_fixed_has_duration
    check (duration_mode = 'open_ended' or planned_duration_minutes is not null)
);

create index idx_sessions_status on public.sessions(status) where status in ('pending', 'active');
create index idx_sessions_host on public.sessions(host_id);

-- ============================================================
-- HOST ASSIGNMENT AUDIT (initial host + every migration)
-- ============================================================
create table public.session_host_assignments (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  user_id       uuid not null references public.users(id),
  assigned_at   timestamptz not null default now(),
  unassigned_at timestamptz,
  reason        text not null check (reason in ('initial_host', 'migration'))
);

create index idx_host_assignments_session on public.session_host_assignments(session_id);

-- ============================================================
-- PRESENCE INTERVALS (durable join/leave history — drives bonus math + rejoin)
-- ============================================================
create table public.session_presence_intervals (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references public.sessions(id) on delete cascade,
  user_id           uuid not null references public.users(id),
  joined_at         timestamptz not null default now(),
  left_at           timestamptz,      -- null while still connected
  disconnect_reason text
                      check (disconnect_reason in ('emergency_exit', 'involuntary_disconnect', 'session_ended'))
);

create index idx_presence_session on public.session_presence_intervals(session_id);
create index idx_presence_user on public.session_presence_intervals(user_id);

-- ============================================================
-- SESSION PARTICIPANTS (per-user summary row, computed at session close)
-- ============================================================
create table public.session_participants (
  id                        uuid primary key default gen_random_uuid(),
  session_id                uuid not null references public.sessions(id) on delete cascade,
  user_id                   uuid not null references public.users(id),
  is_host                   boolean not null default false,
  total_minutes_present     int not null default 0,
  exit_reason               text check (exit_reason in ('completed', 'emergency_exit')),
  group_bonus_earned        boolean not null default false,
  completion_bonus_earned   boolean not null default false,
  points_earned             int not null default 0,

  unique (session_id, user_id)
);

create index idx_participants_session on public.session_participants(session_id);
create index idx_participants_user on public.session_participants(user_id);

-- ============================================================
-- USER STREAKS
-- ============================================================
create table public.user_streaks (
  user_id                 uuid primary key references public.users(id) on delete cascade,
  current_streak          int not null default 0,
  longest_streak          int not null default 0,
  last_session_at         timestamptz,
  streak_grace_expires_at timestamptz   -- last_session_at + 48h
);

-- ============================================================
-- USER STATS (lifetime aggregates — Home screen summary)
-- ============================================================
create table public.user_stats (
  user_id                 uuid primary key references public.users(id) on delete cascade,
  total_minutes           int not null default 0,
  total_points            int not null default 0,
  sessions_completed      int not null default 0,
  sessions_emergency_exit int not null default 0,
  updated_at              timestamptz not null default now()
);

-- ============================================================
-- USER STATS DAILY (time series — Stats screen 7-day chart)
-- ============================================================
create table public.user_stats_daily (
  user_id  uuid not null references public.users(id) on delete cascade,
  day      date not null,
  minutes  int not null default 0,
  points   int not null default 0,
  sessions int not null default 0,
  primary key (user_id, day)
);

-- ============================================================
-- REWARDS HISTORY (audit trail for every point-granting event)
-- ============================================================
create table public.rewards_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id),
  session_id uuid references public.sessions(id),
  points     int not null,
  bonus_type text not null
               check (bonus_type in ('base', 'group_bonus', 'completion_bonus', 'milestone')),
  created_at timestamptz not null default now()
);

create index idx_rewards_user_time on public.rewards_history(user_id, created_at desc);

-- ============================================================
-- MILESTONES (global, periodic — not per-session)
-- ============================================================
create table public.milestones (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  sessions_required int not null,
  bonus_points      int not null
);

create table public.user_milestones (
  user_id      uuid not null references public.users(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id),
  achieved_at  timestamptz not null default now(),
  primary key (user_id, milestone_id)
);
```

## Bonus Computation (business logic, not stored procedures)

Computed by the Node API at session-close time, from `session_presence_intervals`, and written once into `session_participants` + `rewards_history`. Never computed client-side, never re-computed on read.

1. Build a timeline of concurrent-participant-count from all intervals in the session.
2. Find maximal continuous sub-intervals where count ≥ 5. Discard any shorter than 30 minutes — these confer no bonus at all (no partial credit).
3. For each surviving ≥30-minute streak, any participant whose own presence was unbroken for that streak's full duration and whose final `exit_reason = 'completed'` gets `group_bonus_earned = true`.
4. For Completion Bonus: check the session's actual duration ≥ 60 minutes, the participant's first interval started within ~60s of `sessions.started_at`, they have exactly one interval spanning the whole session (no disconnect gaps), and `exit_reason = 'completed'`.
5. `points_earned = total_minutes_present × 1 + (10 if group_bonus_earned) + (10 if completion_bonus_earned)`, expressed as a percentage of the base — additive, not compounded.

All rules above are confirmed final — see `docs/ARCHITECTURE.md` §7/§11.

## Config Constants (Node, not DB — tune here, not in migrations)

| Constant | Default | Notes |
|---|---|---|
| `BASE_POINTS_PER_MINUTE` | 1 | confirmed |
| `GROUP_BONUS_PERCENT` | 10 | fixed, not a formula |
| `GROUP_BONUS_MIN_PARTICIPANTS` | 5 | |
| `GROUP_BONUS_MIN_MINUTES` | 30 | continuous, resets on any drop below threshold |
| `COMPLETION_BONUS_PERCENT` | 10 | |
| `COMPLETION_BONUS_MIN_SESSION_MINUTES` | 60 | |
| `COMPLETION_BONUS_JOIN_TOLERANCE_SECONDS` | 60 | practical tolerance for "joined at the start" |
| `HOST_MIGRATION_PRESENCE_TIMEOUT_SECONDS` | 20 | debounced to avoid migration storms |
| `OPEN_ENDED_SESSION_MAX_HOURS` | 24 | server force-closes past this |
| `STREAK_GRACE_HOURS` | 48 | |
| `BLOCKED_APP_CATEGORIES` | `[Social Networking, Games, Entertainment]` | Fixed default-category blocklist, not per-session/per-user configurable; see `docs/ARCHITECTURE.md` §4 |
