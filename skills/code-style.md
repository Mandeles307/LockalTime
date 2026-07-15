# Skill: Code Style

Read before any coding task. These are binding conventions, not suggestions. If a task needs a rule not covered here, add it here in the same turn rather than deciding ad hoc.

## Formatting & tooling
- **Prettier** is the single source of truth for formatting — no hand-formatting debates. Config lives at repo root, inherited by all workspaces.
- **ESLint** enforces correctness/consistency rules beyond formatting. A task isn't done if `npm run lint` fails.
- 2-space indentation, single quotes, trailing commas (multiline), semicolons required. These match the existing `apps/server` files — keep them consistent across `apps/mobile`.
- Max line length: 100. Let Prettier wrap; don't fight it.

## Naming
- `camelCase` — variables, functions, object properties.
- `PascalCase` — types, interfaces, classes, React components, XState machines.
- `UPPER_SNAKE_CASE` — module-level constants that are true constants (config values, e.g. `BASE_POINTS_PER_MINUTE`).
- `kebab-case` — non-component filenames (`host-migration.ts`, `use-session.ts`) **except** React component files, which are `PascalCase.tsx` (`TimerRing.tsx`).
- No abbreviations that aren't already domain vocabulary. `session`, `participant`, `bonus` — never `sess`, `ptcpnt`, `bns`.
- Booleans read as assertions: `isHost`, `hasCompleted`, `canRejoin` — not `host`, `completed`.

## File & module organization
- One primary export per file; the filename names that export.
- Group by feature/domain, not by technical type, inside a workspace's `src/` — e.g. `modules/sessions/` (server) holds the sessions router, service, and its tests together. The existing `apps/server` health check is the reference layout.
- Barrel `index.ts` files only where they meaningfully simplify imports; don't create them reflexively.
- Keep the testable core separate from the runtime shell. Reference: `apps/server` splits `app.ts` (the Express factory, testable) from `server.ts` (the `listen()` bootstrap, not tested). Mirror this separation everywhere — pure logic must be importable without side effects.

## Imports
- Order: (1) node/react/framework built-ins, (2) third-party packages, (3) internal absolute imports, (4) relative imports. Blank line between groups. ESLint enforces this.
- No deep relative chains (`../../../`). Configure path aliases per workspace and use them.

## Comments
- Comment *why*, not *what*. The code says what it does; comments explain non-obvious reasoning (e.g. why host promotion picks highest cumulative minutes, not earliest joiner).
- No commented-out code in commits. Delete it — git remembers.
- Match the surrounding file's existing comment density.

## Money-equivalent logic marker
- Any function that computes or mints points, bonuses, or QR tokens carries a short header comment noting it is authoritative server-side logic per `ARCHITECTURE.md` §3/§7, so a future reader never moves it client-side by accident.
