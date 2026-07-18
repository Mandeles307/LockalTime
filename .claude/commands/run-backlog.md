---
description: Autonomously work through backlog.md, one TDD task at a time, delegating to subagents
---

Work through `backlog.md` autonomously, starting at the first unchecked item, phase order strictly respected (each phase's prerequisites are real). This is an explicitly requested autonomous run per the working contract in CLAUDE.md — commits and pushes after each green task are authorized by that contract.

## Preflight (once, before the first task)

1. `git status` — if the tree is dirty, review the diff:
   - Coherent **completed** work (e.g. leftovers from a previous session): commit as `checkpoint: pre-run state` and push.
   - Clearly an **in-progress attempt at the first unchecked backlog item** (a common state after an interrupted run): resume it through the normal per-item flow — treat existing tests/code as Stage A/B output, review them against docs/DoD exactly as if a subagent had just produced them, fix or finish, verify, close out. If the partial work fails that review, prefer rewriting the affected files over `git checkout --`/`reset` (nothing uncommitted is ever bulk-discarded without asking).
   - Anything contradictory or unidentifiable: stop and ask.
2. Verify the toolchain and record what's available: Node, Supabase CLI + Docker (`supabase start` must succeed for DB tasks), `ANDROID_HOME`/`adb`/emulator. A missing tool never crashes the run: tasks whose *verification* needs it proceed and get "(manual QA pending: <tool>)" — but never mark an item `[x]` whose *implementation* (not just verification) needs the missing tool; that item stays unchecked and is reported as skipped.
3. Memory/8GB note: never run the Android emulator, the full local Supabase stack, and a Gradle build simultaneously if avoidable — sequence heavy verifications and shut down what the current step doesn't need.

## Per item

1. Read the docs sections the item cites (`docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DESIGN_GUIDELINES.md` for anything with UI) and the relevant `skills/` files.
2. **Stage A — tests only:** spawn a subagent whose prompt contains: the backlog item verbatim plus its phase DoD, the exact `skills/` files to read first, and an explicit instruction to write ONLY the test/spec file(s) plus a short rationale — no implementation code — then stop and report.
3. **Gate:** review Stage A's test file yourself against `docs/` and the DoD (that review is the working contract's "agreed as correct"). If wrong or weak, send corrections back to the same subagent via SendMessage until right.
4. **Stage B — implement:** continue the same subagent via SendMessage (it has the context) to implement per the TDD protocol in `skills/testing-standards.md`: confirm the tests fail for the right reason, minimal implementation, refactor.
5. **Verify yourself** — never trust the subagent's summary: run the affected workspace's `npm test`, `npm run lint`, and typecheck (scripts live per-workspace, e.g. `apps/server`; don't assume a root script aggregates them), and `supabase test db` if the schema changed.
6. **Close out:** check the box in `backlog.md`, update any `.md` whose claims changed (including CLAUDE.md's Current Status at phase boundaries), commit, push to `origin`. Only commit green. The orchestrator — never a subagent — edits `backlog.md`, commits, and pushes.

## Sequencing

Sequential by default. Parallelize only within one phase, only when two items touch disjoint directories, share no config files, and **neither touches `supabase/` nor runs DB tests** (there is a single local Supabase stack — parallel DB work collides). Parallel subagents get worktree isolation; the orchestrator merges, re-runs the full suite, and serializes all commits/pushes itself.

## Stop and ask ONLY when

- The item turns on a decision listed under "known gaps" in CLAUDE.md, or a product/design question not derivable from `docs/` or existing tests — never invent one.
- The suite is red after 3 focused fix attempts.
- An action is destructive or irreversible outside the repo (e.g. changing GitHub repo settings, touching the production Supabase project — which migrations never target, per CLAUDE.md).

Missing credentials, accounts, hardware, or a Mac are **not** stop conditions — they route to the manual-verification path below. When genuinely stopped, first commit+push any completed green work so nothing is lost.

## Manual-verification DoDs

When a DoD requires a physical device, a Mac (none is currently available — iOS code is authored and contract-tested on this PC, never compiled here), credentials not yet provided, or any other manual step: implement everything implementable, write the manual-QA checklist into `docs/` per `skills/testing-standards.md`, mark the backlog item `[x]` with a "(manual QA pending: <what>)" suffix, and flag it in your report.

## Reporting

After each closed item: one or two sentences — what shipped, suite status, what's next. When the session ends or you're blocked: summarize which items closed, which are manual-QA pending, and the exact question(s) blocking you.
