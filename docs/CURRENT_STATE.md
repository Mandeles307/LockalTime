# Current Development State

**This file is a living snapshot, not a permanent record.** Unlike `ARCHITECTURE.md`/`DATABASE.md` (stable design) or `backlog.md` (task checklist), this file exists purely so a session on a different device/after a context reset can resume exactly where the last one left off. Overwrite it whenever picking up or pausing work — stale content here is worse than none.

Last updated: 2026-07-15, mid Phase 0.

## Where we are right now

- **Phase 0 (Bootstrap)** in progress. `Monorepo scaffold` is the only item checked `[x]` in `backlog.md` so far.
- **Node.js API skeleton** (`apps/server`: Express + TypeScript + Jest/supertest) — files are written but marked `[~]` (unverified) in `backlog.md`, not `[x]`.
  - Node.js was just installed on the dev machine (confirmed: `v24.18.0`, npm `12.0.1`) after a computer restart — it wasn't available for most of Phase 0 so far.
  - First `npm install` attempt in `apps/server` failed with `ECONNRESET` (transient network issue while fetching `@types/express`), not a config problem.
  - A retry was kicked off and was still running/pending as of this snapshot.
- Everything up through the last push is on `origin/main` (commit `ecfb380`) — safe to `git pull` from any device and resume.

## Immediate next steps, in order

1. Check whether `npm install` in `apps/server` succeeded (retry again if it hit another transient network error).
2. Run `npm test` in `apps/server`; confirm the `GET /health` test actually passes (it has never been executed yet, only manually reviewed).
3. On green: flip the Node.js API skeleton line in `backlog.md` to `[x]`, commit `package-lock.json` (should be checked in for reproducible installs) + the updated `backlog.md`, push.
4. On failure: diagnose from the actual error, don't just retry blindly.
5. Then continue Phase 0: React Native app init (bare workflow — decision on state mgmt/navigation library still needed first, see gaps below), local Supabase project + CLI, CI pipeline, seed `skills/`.

## Known open gaps (do not assume any of these are decided)

RN state management + navigation library choice; E2E tool (Detox vs. Maestro); push notification infrastructure (no `device_tokens` table exists yet); analytics/observability; ToS/privacy policy content; deployment/environments; B2B monetization + Verified Host application flow; RTL/i18n handling; concrete milestone definitions (only one example exists); data retention policy.

## Everything else

- `docs/ARCHITECTURE.md` — full system design, confirmed/locked (screens, native blocking, realtime, points/bonus engine, security model)
- `docs/DATABASE.md` — schema + bonus computation algorithm, confirmed/locked
- `backlog.md` — the actual phase-by-phase task list; this file is just a pointer into it
- `CLAUDE.md` — auto-loaded on every session; read that first, it links here
