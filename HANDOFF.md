# Project Handoff — read this first, then delete it

You are a fresh Claude Code session on a different machine, picking up the **Lockal Time** project. The previous session's conversation history does **not** transfer between machines. This file carries the *live, in-progress* context that isn't already in the durable docs. It is deliberately temporary — consume it and remove it (staleness is why we don't keep a permanent state-snapshot file).

## Your steps (do these in order)
1. Read this whole file.
2. Read the durable source of truth (all committed, all accurate): `CLAUDE.md`, `backlog.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DESIGN_GUIDELINES.md`, and everything in `skills/`.
3. **Verify tooling on THIS machine — do not assume it matches the previous one.** Run: `node --version`, `npm --version`, `git config user.name`, `git config user.email`, `docker --version`, `supabase --version`. (Previous machine: Node installed & working; Docker + Supabase CLI NOT installed; git identity was configured as Mandeles307 / ronm307@gmail.com.)
4. Briefly tell the user what you understand the current state and next step to be, so they can confirm you're synced.
5. **Then delete `HANDOFF.md`, remove the pointer line at the very top of `CLAUDE.md`, commit both removals, and push.** This returns the repo to a clean state.

## What this project is
Social, location/time/group-based distraction-blocking app: native iOS + Android (React Native), Node.js/Express business-logic API, Supabase (Postgres/Auth/Realtime). Full design in `docs/ARCHITECTURE.md`. Money-equivalent logic (points/bonuses/QR) is computed ONLY server-side — never trust the client.

## Current status — Phase 0 (Bootstrap), see `backlog.md`
- **Done & verified:** monorepo scaffold; Node API skeleton (`apps/server`, Express + TS + Jest, health test green, `npm test`/`build` pass); `skills/` seeded (4 convention files).
- **Remaining in Phase 0:** React Native app init; local Supabase + `users` migration (in flight, see below); CI pipeline.

## In-flight task: local Supabase + `users` migration
- **Test written test-first:** `supabase/tests/users_test.sql` (pgTAP). **UNVERIFIED** — needs Docker + Supabase CLI to run (`supabase start`, `supabase test db`). Expect to fix pgTAP function signatures and the `auth.users` seed insert against the real DB on first run; the asserted *behavior* is the agreed contract.
- **The migration SQL itself is NOT written yet** — write it only *after* the user confirms the three RLS rules below, then verify against the running local DB.
- **Three RLS behavior decisions AWAITING USER CONFIRMATION (ask — do not assume):**
  1. A user can read only their own `users` row.
  2. A user can update their own editable fields (e.g. `display_name`).
  3. A user **cannot** change their own `role` — privilege-escalation guard, enforced via column-level `REVOKE UPDATE(role) FROM authenticated`. **Security-critical**; role changes only via the Verified-Host approval flow (Phase 6) or service role.

## Decisions locked this session (already reflected in the docs — listed for quick orientation)
- Backend framework: **Express**. RN libraries: **React Navigation + Zustand + XState**.
- Android blocking: **UsageStats + Overlay + Foreground Service** (NOT AccessibilityService — Play policy). Blocking policy: **fixed default OS app categories** (no per-app picker).
- Points/bonus spec fully locked (`ARCHITECTURE.md` §7): 1 pt/min base; +10% group bonus (5+ people, continuous 30 min, count-based reset); +10% completion bonus (≥60 min session, joined at start, zero disconnects); bonuses additive (+20% max); emergency exit forfeits both.
- **Dev database: local Docker** (decided). Production: cloud Supabase (free tier viable at launch; realtime concurrency, not storage, is the scaling limit).
- Design guidelines: structural (spacing/radius/type/motion/haptics) locked; **colors deliberately deferred**.

## Environment notes
- Dev DB = local Docker. Install (Windows): Docker via `winget install Docker.DockerDesktop`; Supabase CLI via Scoop — `irm get.scoop.sh | iex`, then `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git`, then `scoop install supabase`. Verify on THIS machine before use.
- iOS builds require macOS (unavailable on the Windows dev machine) — Android-first; iOS native blocking module deferred until Mac access exists. This is Apple's constraint, not React Native's.

## Working contract (also in `CLAUDE.md` — follow it exactly)
Atomic iteration (ONE backlog task per turn). TDD (test first, agreed correct, then implementation). Documentation-first close-out (update `backlog.md` + any doc whose claims changed, same turn). Read relevant `skills/` before any coding task.

## Immediate next action
Await (a) user confirmation of the three RLS rules, and (b) Docker + Supabase CLI installed and Docker running on this machine. Then write the `users` migration, run `supabase test db`, fix syntax, verify green, and mark the backlog item `[x]`.
