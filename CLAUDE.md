# Lockal Time

Social, location/time/group-based distraction-blocking app. Native iOS + Android via React Native, Node.js API for business logic, Supabase (Postgres/Auth/Realtime) for data/auth/realtime.

**Read before doing anything else:**
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — screens, tech stack, native blocking modules, realtime design, session lifecycle/host authority, points & bonus engine, security threat model
- [docs/DATABASE.md](docs/DATABASE.md) — full schema, bonus computation algorithm, config constants
- [docs/DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) — spacing/radius/typography/motion consistency rules; read before building any screen. Color palette intentionally deferred.
- [backlog.md](backlog.md) — the phased WBS; current progress and next task
- `skills/` — code style, TypeScript strictness, Supabase conventions, testing standards. **Binding.** Read the relevant file(s) before writing any code; this applies to subagents too — a subagent prompt for a coding task must name the skills files to read.

## Current Status

Phase 0 (bootstrap) is mostly done — see `backlog.md` checkboxes for the authoritative state. Done: monorepo scaffold, Express+TypeScript+Jest API skeleton in `apps/server` (install/test/build green), local Supabase with `users` migration + RLS + pgTAP suite, `skills/` seeded, React Native 0.86 app in `apps/mobile` (bare, TS strict, React Navigation + Zustand + XState wired, jest/lint/typecheck green; native compiles are manual-QA pending — no Android SDK platforms or Mac here). Note: `apps/mobile` is deliberately **excluded** from npm workspaces (root `workspaces` is `["apps/server"]`) so Metro/Gradle keep their own `node_modules`. Remaining in Phase 0: CI pipeline.

Decided (don't re-litigate): Express (not NestJS); React Navigation + Zustand + XState for the RN app; Maestro (not Detox) for E2E; app identifier `com.lockaltime.app` (Android applicationId + iOS bundle ID); i18n from day one — English + Hebrew, including RTL support, no hardcoded UI strings; color palette stays deferred — screens use neutral grayscale design tokens, real palette swapped in later in one pass; migrations verified against local Supabase only, the user pushes to the linked production project manually; Phase 1 auth order — email auth built and fully tested first, Google/Apple wired against placeholder config and marked "manual QA pending" until real credentials exist; **no Mac currently available** — all iOS code (Swift modules, extensions, Xcode/Pod config) is authored on this PC and verified via JS-side contract tests per `skills/testing-standards.md`, while compiling/running/device-testing iOS is marked "manual QA pending (Mac required)" and never blocks a phase; Verified Host (Phase 6) — granted manually by flipping a DB flag in Supabase, no in-app application flow yet; staging (Phase 7) — a second free-tier Supabase project (`LockalTime-staging`), migrations applied there before prod, E2E/load tests target staging or local, never production.

Known gaps not yet designed (do not assume these are decided — ask before building around them): push notification infrastructure (no `device_tokens` table exists), analytics/observability, ToS/privacy policy content, deployment/environments beyond the staging decision above, B2B monetization & a real Verified Host application flow (minimal manual-flag approach decided for now), concrete milestone definitions, data retention policy.

## Working Contract

- **Atomic iteration, self-paced:** work through `backlog.md` tasks sequentially without waiting for an explicit "next" between them — bundling several tasks into one session is fine. Each task still closes fully before the next starts: TDD → implementation → full suite green (`npm test`, `npm run lint`, typecheck; `supabase test db` if the DB changed) → docs/backlog updated. Stop and ask when a task turns on a product/design decision that isn't derivable from `docs/` or existing tests — not merely to ask permission to keep going. Anything touching a listed "known gap" always stops and asks; never invent a decision there.
- **TDD:** every code task starts with the `.test.ts`/`.spec.tsx` file (or pgTAP equivalent), agreed as correct, *before* any implementation code is written. "Agreed as correct" means: reviewed against `docs/` and the phase DoD, with the reasoning made explicit, before implementation proceeds.
- **Documentation-first close-out:** a task isn't done until `backlog.md` has it checked `[x]` and any `.md` file whose claims changed (e.g., `ARCHITECTURE.md` for a new service, `DATABASE.md` for a schema change) is updated in the same turn.
- **Skills system:** read the relevant file(s) in `skills/` before starting a coding task; if a needed convention doesn't exist yet, write it into `skills/` alongside the code, not after.
- **Commits:** only when explicitly asked — self-pacing through tasks doesn't imply auto-committing. Exception: an explicitly requested unattended/background autonomous run over `backlog.md` commits **and pushes to `origin`** after each task closes (full suite green + docs updated), giving a checkpoint to recover from if something later in the run goes wrong.

## Money-Equivalent Logic Rule

Points, bonuses, QR tokens, and anything else that affects a user's earned rewards are computed and minted **only** in the Node.js API, never trusted from a client claim, and never computed client-side even for display — always fetched from the server's authoritative value. See `docs/ARCHITECTURE.md` §3 and §8 for why.
