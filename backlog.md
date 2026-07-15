# Lockal Time — Backlog

Tracked per our working contract: one atomic task at a time, test-first, this file updated (`[x]`) the moment a task closes, alongside any `.md` file whose claims changed.

## Phase 0 — Bootstrap
Prerequisites: none.

- [x] Monorepo scaffold (`apps/mobile`, `apps/server`, `supabase/`, `docs/`, `skills/`)
- [ ] React Native app init (bare workflow, not Expo managed — needed for native modules)
- [x] Node.js API skeleton (Express, TypeScript, Jest+supertest) — `npm install` + `npm test` + `npm run build` all verified green in `apps/server`.
- [ ] Local Supabase project + CLI (`supabase start`), initial migration for `users`
- [ ] CI pipeline: lint + typecheck + test, green on empty-feature repo
- [ ] `skills/` seeded: `code-style.md`, `typescript-strictness.md`, `supabase-integration.md`, `testing-standards.md`

**DoD:** `npm test` and `npm run lint` pass on an empty-feature repo; local Supabase boots; CI pipeline green.

## Phase 1 — Auth & Onboarding (Screens 1–3)
Prerequisites: Phase 0.

- [ ] Supabase Auth wiring: Google, Apple, email
- [ ] `users` row auto-created via trigger on signup
- [ ] Onboarding carousel (Screen 1)
- [ ] Permission-priming screen copy/logic (Screen 2) — including the denied-permission fallback state
- [ ] Auth error states: wrong OTP, network failure, OAuth account-linking dialog

**DoD:** new user can sign up via all 3 providers in local/dev; RLS tested — a user can only read/write their own `users` row.

## Phase 2 — Core Session State & Realtime (Screens 4–8 skeleton)
Prerequisites: Phase 1.

- [ ] `sessions`, `session_participants`, `session_presence_intervals`, `session_host_assignments` migrations
- [ ] Node: create-session endpoint (QR signing, `duration_mode` handling)
- [ ] Node: join-session endpoint (signature/expiry/capacity checks)
- [ ] Play Integrity (Android) / App Attest (iOS) check wired into create + join, **monitor-mode only** (log verdicts, no enforcement yet)
- [ ] Realtime channel wiring: Presence + Broadcast + Postgres Changes
- [ ] `useSession` hook
- [ ] Home / Create / Scan / Details screens wired to real data (no native blocking yet — sessions are "virtual")

**DoD:** two devices/simulators can create and join the same session and see each other in a live participant list; Play Integrity verdicts are logged and visible for later analysis.

## Phase 3 — Native Blocker Bridge
Prerequisites: Phase 2 (needs a real session to attach to).

- [ ] Android: Foreground Service + `UsageStatsManager` polling + `SYSTEM_ALERT_WINDOW` overlay (not AccessibilityService — see ARCHITECTURE.md §4)
- [ ] Android: boot-persistence `BroadcastReceiver` on `BOOT_COMPLETED`
- [ ] iOS: `FamilyControls` authorization + `ManagedSettings` shield + `DeviceActivityMonitor` extension + App Group bridge
- [ ] Unified `AppBlockerModule` JS interface (`start/stop/getStatus` + event emitter)
- [ ] `useAppBlocker` hook reconciling native events with session state
- [ ] Apple Family Controls entitlement application submitted (parallel track, not blocking dev)

**DoD:** on a physical device, starting a session actually blocks a test app; killing the app or rebooting the device does not lift the block prematurely.

## Phase 4 — Session Lifecycle Logic
Prerequisites: Phase 3.

- [ ] Points/bonus math as pure functions (base rate, group bonus, completion bonus, stacking) — **test-first**, spec fully confirmed in ARCHITECTURE.md §7
- [ ] Emergency exit flow end-to-end (Screen 9)
- [ ] Completion flow end-to-end (Screen 10)
- [ ] Host migration worker (Presence-timeout detection, highest-minutes-present promotion, `session_host_assignments` audit)
- [ ] Host-migration toast (new host only, calm, few seconds)
- [ ] Open-ended session 24h auto-close job
- [ ] Offline 30-minute native-enforced cutoff
- [ ] Screen 13 (Welcome Back / Session Interrupted) + rejoin flow reusing Session Details screen

**DoD:** full lifecycle (create → active → emergency-exit-or-complete) produces correct `rewards_history` rows, verified by integration test against the confirmed bonus spec; 2-device host-drop test correctly migrates within the debounce window; disconnect-and-rejoin test correctly disqualifies Completion Bonus but preserves earned base points.

## Phase 5 — Gamification & Stats (Screens 11–12)
Prerequisites: Phase 4 (needs real `rewards_history` data).

- [ ] Streak calculation job (48h grace)
- [ ] Milestone crossing detection (global, periodic)
- [ ] `user_stats` / `user_stats_daily` write-through at session close
- [ ] History screen with Solo/Group/All filters + empty state
- [ ] Stats screen with 7-day chart

**DoD:** streak survives a 47h gap, breaks after 49h (both boundaries tested); Stats screen sum matches `rewards_history` exactly.

## Phase 6 — Hardening & B2B
Prerequisites: Phase 5.

- [ ] Remaining edge-case screens: QR expired/invalid/at-capacity, offline banner, late-join details
- [ ] Verified Host manual approval flow (admin-only)
- [ ] Static QR + `venues` table wiring
- [ ] In-app B2B dashboard screen (avg. session duration/customer, concurrent active customers), gated by `verified_host` role
- [ ] Root/jailbreak detection — flag session "unverified," exclude from group bonus only
- [ ] Play Integrity/App Attest enforcement turned on (graduated: lowest tier excluded from bonus/streak only, never blocks usage) — based on Phase 2's monitor-mode data

**DoD:** every edge case has an explicit screen/state, covered by a test or documented manual QA step; B2B screen shows correct live metrics for a verified host account.

## Phase 7 — Release Prep
Prerequisites: Phase 6.

- [ ] App Store Screen Time entitlement — confirm approval status, or document fallback plan
- [ ] Privacy nutrition labels (confirm: no geolocation, no contacts collected)
- [ ] Detox/Maestro E2E suite across golden paths (create → join → complete; create → emergency exit)
- [ ] Load-test Realtime channel at target concurrency

**DoD:** E2E suite green on CI against staging Supabase; entitlement approved or fallback documented.

