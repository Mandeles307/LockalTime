# Lockal Time

Social, location/time/group-based distraction-blocking app. Native iOS + Android via React Native, Node.js API for business logic, Supabase (Postgres/Auth/Realtime) for data/auth/realtime.

**Read before doing anything else:**
- [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) — **read this first**: exactly where the last session left off, in-flight tasks, immediate next steps. A living snapshot, not stable design — overwrite it whenever pausing/resuming work.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — screens, tech stack, native blocking modules, realtime design, session lifecycle/host authority, points & bonus engine, security threat model
- [docs/DATABASE.md](docs/DATABASE.md) — full schema, bonus computation algorithm, config constants
- [backlog.md](backlog.md) — the phased WBS; current progress and next task
- `skills/` — code style, TypeScript strictness, Supabase conventions, testing standards (seeded in Phase 0, not yet created)

## Current Status

Planning complete. **No code has been written yet.** Repo currently contains only docs + backlog. Next real step is Phase 0 (bootstrap) in `backlog.md`.

Known gaps not yet designed (do not assume these are decided — ask before building around them): backend framework choice (Express vs. NestJS), RN state management/navigation library, E2E tool (Detox vs. Maestro), push notification infrastructure (no `device_tokens` table exists), analytics/observability, ToS/privacy policy content, deployment/environments, B2B monetization & Verified Host application flow, RTL/i18n handling, concrete milestone definitions, data retention policy.

## Working Contract

- **Atomic iteration:** one task from `backlog.md` per turn. Never bundle multiple backlog items into a single response.
- **TDD:** every code task starts with the `.test.ts`/`.spec.tsx` file, agreed as correct, *before* any implementation code is written.
- **Documentation-first close-out:** a task isn't done until `backlog.md` has it checked `[x]` and any `.md` file whose claims changed (e.g., `ARCHITECTURE.md` for a new service, `DATABASE.md` for a schema change) is updated in the same turn.
- **Skills system:** read the relevant file(s) in `skills/` before starting a coding task; if a needed convention doesn't exist yet, write it into `skills/` alongside the code, not after.

## Money-Equivalent Logic Rule

Points, bonuses, QR tokens, and anything else that affects a user's earned rewards are computed and minted **only** in the Node.js API, never trusted from a client claim, and never computed client-side even for display — always fetched from the server's authoritative value. See `docs/ARCHITECTURE.md` §3 and §8 for why.
