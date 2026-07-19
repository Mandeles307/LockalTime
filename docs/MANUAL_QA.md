# Manual QA Checklist

Items that cannot be verified on this development machine (no Android SDK platforms installed, no Mac, no physical devices) or that are inherently manual. Per `skills/testing-standards.md`, each backlog item marked "(manual QA pending: …)" points here. Check items off when performed on real hardware; a checked backlog item with a pending entry here is implemented and JS-verified but not device-verified.

## Phase 0 — React Native app init

- [ ] **Android build & launch** — `cd apps/mobile/android && ./gradlew assembleDebug`, install on device/emulator, app launches to the Home placeholder. (Blocked locally: Android SDK has `cmdline-tools` only; also note the repo path contains non-ASCII characters, which some NDK/CMake tooling handles poorly — if the build fails on path issues, build from a cloned ASCII path.)
- [ ] **iOS build & launch** — `pod install` in `apps/mobile/ios`, build in Xcode, launches to Home placeholder; bundle ID shows `com.lockaltime.app`. (Blocked locally: no Mac — locked constraint in CLAUDE.md.)

## Phase 1 — i18n + RTL foundation

- [ ] **Hebrew device-language switch** — set device language to עברית, cold-start the app **twice** (`I18nManager.forceRTL` only takes effect on the next app start after the sync runs): Hebrew strings shown, layout mirrored (rows flipped, text right-aligned), no clipped/overlapping views on the Home screen.
- [ ] **Back to English** — switch device language back to English, two cold starts: layout returns to LTR, English strings shown.
- [ ] **Unsupported RTL locale** — set device language to Arabic (unsupported): app must fall back to English **in LTR layout** (the `allowRTL(isRtl)` guard — an unsupported-RTL device must not get a mirrored layout under English strings).

## Phase 1 — Onboarding carousel (Screen 1)

- [ ] **RTL carousel behavior on-device (Hebrew)** — with device language set to עברית (two cold starts, per the `forceRTL` note above), on a fresh install (or after clearing app storage so the onboarding-seen flag is unset): the first page appears on the right and swiping **left-to-right** advances through the three pages in order; pagination dots are mirrored (active dot progresses right-to-left) and always match the visible page — including after pressing «הבא» (Next); skip sits at the visual top-left (the `end` edge). Not JS-testable: `I18nManager` is inert under Jest, and the paging math relies on native RTL scroll-offset semantics (iOS reports negative offsets; the JS side only sees `Math.abs`).

## Phase 1 — Permission priming (Screen 2)

- [ ] **Real OS permission flows — deferred to Phase 3 (native blocker bridge)** — in Phase 1 the blocking-permissions service is a pure-JS placeholder (`getStatus()` → `undetermined`, `request()` → `denied`), so pressing Allow deterministically lands on the denied fallback and no OS dialog exists to test yet. When the Phase 3 native module replaces the placeholder, verify on-device: Android — Allow launches the Usage Access and Display-over-other-apps settings intents, granting both flips `getStatus()` to `granted`, and the fallback's "Open settings" → grant → return-and-retry round-trip recovers to granted; iOS — Allow presents the FamilyControls authorization prompt (entitlement approval pending with Apple, and Mac required — locked constraint in CLAUDE.md); both — "Continue without blocking" still reaches Home with the permission ungranted, and a returning user who handled the step (either path) skips Screen 2 entirely on next cold start.

## Phase 1 — Supabase Auth wiring

- [ ] **End-to-end email OTP against the local stack** — with `supabase start` running (full stack, Mailpit included): call `requestEmailOtp` with a fresh address, read the 6-digit code from the Mailpit web UI at http://127.0.0.1:54324, call `verifyEmailOtp`, confirm an authenticated session; then cold-restart the app and confirm the session was rehydrated from AsyncStorage (auth store authenticated without a new login). Note: local `[auth.rate_limit] email_sent = 2`/hour — repeated runs need a stack restart or a temporary limit bump. *This entry graduates to a real node-env integration test alongside the "Auth error states" backlog item (the unit suites pin the supabase-js call contract until then; the `users`-trigger pgTAP suite covers real signup at the DB level).*
- [ ] **Google sign-in** — blocked until real Google OAuth credentials exist and the native Google Sign-In SDK is integrated; `[auth.external.google]` currently carries a placeholder client id. Verify: native sign-in completes, `signInWithGoogle` exchanges the ID token, session lands in the auth store.
- [ ] **Apple sign-in** — blocked until real Apple credentials exist (and a Mac/device — locked constraint in CLAUDE.md); `[auth.external.apple]` carries the bundle-ID placeholder client id. Verify: Sign in with Apple completes, `signInWithApple` exchanges the identity token + nonce, session lands in the auth store.
