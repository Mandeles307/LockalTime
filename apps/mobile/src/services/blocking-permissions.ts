// Blocking-permission service contract for Screen 2 (permission priming).
//
// The REAL requests are native (ARCHITECTURE.md §4): Android Usage Access +
// SYSTEM_ALERT_WINDOW via settings intents, iOS FamilyControls authorization.
// Those land with the Phase 3 native bridge — this module is the SEAM: the
// screen codes against this surface only, so Phase 3 swaps the implementation
// below for the real native module without touching the screen
// (blocking-permissions.test.ts pins the surface; .claude/skills/testing-standards/SKILL.md
// native-modules rule).
//
// PHASE 1 PLACEHOLDER, deliberately deterministic pure JS:
// - getStatus() always resolves 'undetermined' — nothing native exists to
//   consult.
// - request() always resolves 'denied' — no bridge exists that could actually
//   grant, and resolving 'granted' would fake a capability the app does not
//   have. Phase 1 builds therefore exercise the denied-fallback path for
//   real, which is the state that needs the recovery UX.
// - Neither call ever rejects: permission state is an answer, not an error.
//
// One combined status for the blocking capability as a whole — per-platform
// nuance (Android's two separate grants) stays inside the future native
// module, which reports the weakest link.

export type BlockingPermissionStatus =
  | { readonly status: 'granted' }
  | { readonly status: 'denied' }
  | { readonly status: 'undetermined' };

export interface BlockingPermissionsService {
  getStatus(): Promise<BlockingPermissionStatus>;
  request(): Promise<BlockingPermissionStatus>;
}

export const blockingPermissions: BlockingPermissionsService = {
  getStatus: async (): Promise<BlockingPermissionStatus> => ({ status: 'undetermined' }),
  request: async (): Promise<BlockingPermissionStatus> => ({ status: 'denied' }),
};
