# Skill: Supabase Integration

Read before any task touching the database, auth, realtime, or migrations. The central rule flows from `ARCHITECTURE.md` §3: Supabase is the source of truth for *data*, but is **not** trusted to enforce money-equivalent business logic — that lives in the Node API.

## The trust boundary (non-negotiable)
- **Direct client → Supabase reads** are allowed only for read-only aggregates the user is entitled to see: home summary, history, stats (`ARCHITECTURE.md` §3). These are protected by RLS.
- **Any write that affects points, bonuses, QR validity, or session lifecycle goes through the Node API**, never a direct client `.insert()/.update()`. A modified client calling `supabase.from('sessions').update(...)` must not be able to forge state — RLS is a backstop, but the API is where the logic is enforced.
- Broadcast/Presence realtime messages are **UI hints only** (`ARCHITECTURE.md` §5). Never finalize points or trust session state from a Broadcast event; re-confirm against Postgres (CDC / authoritative read).

## Migrations
- All schema changes are timestamped SQL files in `supabase/migrations/` — the executable source of truth. `DATABASE.md` is the human-readable explanation and must be updated in the same task as any migration that changes shape.
- Migrations are forward-only and idempotent-safe to run on a fresh DB. Never edit a migration that has already been applied/committed; add a new one.
- Test every migration locally against `supabase start` before it's considered done.

## RLS
- RLS is **on** for every table holding user data. Default-deny; add explicit policies.
- A user can read/write only their own rows unless a policy deliberately widens it (e.g. a participant reading co-participants in a shared session). Every widening policy gets a comment explaining why it's safe.
- Write an RLS test for each policy: assert the owner can, and a non-owner cannot. (Phase 1 DoD requires this for `users`.)

## Types & client
- Generate types with `supabase gen types typescript`; treat generated types as authoritative for row shapes (see `typescript-strictness.md`). Regenerate on every schema change.
- One shared `supabaseClient.ts` per app (`apps/mobile/src/services/`). Never scatter client construction.
- Service-role keys live only on the Node server, never in the mobile app or any client-reachable place. The mobile app uses the anon key + user session only.

## Realtime specifics
- Per-session channel naming: `session:{session_id}` (`ARCHITECTURE.md` §5).
- Presence heartbeat drives host-liveness detection; do not build a parallel persisted heartbeat table (`DATABASE.md` design note).
- On reconnect, hydrate from an authoritative REST read first, then resume the CDC stream — don't assume in-memory Broadcast events survived the drop.
