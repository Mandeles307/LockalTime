# Skill: TypeScript Strictness

Read before any coding task. The bar is high on purpose — this app handles money-equivalent logic (points/bonuses) where a silent type coercion is a real bug, not a cosmetic one.

## Baseline
- `strict: true` in every `tsconfig.json` (already set in `apps/server`). Never relax it per-file or per-project.
- Additionally enable, or treat as if enabled: `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`. Array/record access returns `T | undefined` — handle the `undefined`.

## Hard rules
- **No `any`.** Not in app code, not "temporarily." If a type is genuinely unknown at a boundary (external input, a bridge payload), use `unknown` and narrow it explicitly.
- **No non-null assertions (`!`) to silence the compiler.** If a value can be null, prove it isn't via a check, or model it so it can't be.
- **Explicit return types on all exported functions.** Inference is fine for locals; public surfaces are documented by their signatures.
- **No unchecked type assertions (`as X`) on data crossing a trust boundary** — API responses, Supabase rows, native-bridge events, QR payloads. Validate at the boundary (see below) and let the validated type flow inward.

## Boundaries & validation
- Runtime-validate everything entering the system from outside the type system: HTTP request bodies, Supabase query results that aren't from generated types, native module event payloads, decoded QR tokens. Use a schema validator (e.g. Zod) so the parsed result *is* the typed value — no separate `as`.
- Supabase: use generated database types (`supabase gen types typescript`) as the source of truth for row shapes. Regenerate them when a migration lands; don't hand-write row interfaces that can drift from the schema.

## Domain modeling
- Prefer discriminated unions over boolean flags for states that are mutually exclusive. Session lifecycle is a union (`pending | active | host_disconnected | ...`), modeled in XState per `ARCHITECTURE.md` §6 — not a bag of `isActive`/`isPending` booleans.
- Make illegal states unrepresentable where practical: a `completed` session should carry its `ended_at`; an `open_ended` session's type should reflect the absent `planned_duration_minutes`, matching the DB CHECK constraints in `DATABASE.md`.
- Money-equivalent values are integers (points are whole numbers). Never introduce floating-point into point arithmetic; the bonus stack is additive percentages applied to an integer base (`DATABASE.md` bonus computation step 5).
