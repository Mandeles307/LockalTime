import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Phase 1 permission-step gating (Screen 2), mirroring the onboarding-store
// pattern. The gate is a discriminated union
// (.claude/skills/typescript-strictness/SKILL.md): App cannot read a handled/unhandled
// answer before AsyncStorage has actually been consulted, so a cold start can
// never flash the wrong screen.
//
// Semantics: the flag records that the user has BEEN THROUGH the priming step
// — via a granted request OR the denied fallback's explicit proceed-anyway —
// never that the permission is granted. Live grant state is always the
// blocking-permissions service's answer; nothing may read this flag as
// "blocking works".
//
// Failure policy (pinned in permission-store.test.ts): fail open. A storage
// read failure hydrates as unhandled and a persistence failure still marks
// handled in-memory — the worst case is one repeat of a skippable priming
// screen, while failing closed would strand the app in the gate.

// Renaming this key would silently orphan every persisted flag — it is pinned
// by test on purpose.
export const PERMISSION_STEP_HANDLED_STORAGE_KEY = '@lockal-time/permission-step-handled';

export type PermissionStepGate =
  | { readonly status: 'hydrating' }
  | { readonly status: 'ready'; readonly hasHandledPermissionStep: boolean };

interface PermissionState {
  permissionStep: PermissionStepGate;
}

export const usePermissionStore = create<PermissionState>()(() => ({
  permissionStep: { status: 'hydrating' },
}));

// Reads the persisted flag into the store; the App bootstrap calls this once
// per mount. Any value other than the exact 'true' written by
// markPermissionStepHandled (including corruption) counts as unhandled.
export const hydratePermissionStepStatus = async (): Promise<void> => {
  let hasHandledPermissionStep = false;
  try {
    hasHandledPermissionStep =
      (await AsyncStorage.getItem(PERMISSION_STEP_HANDLED_STORAGE_KEY)) === 'true';
  } catch {
    // Fail open — see header comment.
  }
  usePermissionStore.setState({
    permissionStep: { status: 'ready', hasHandledPermissionStep },
  });
};

// The granted path and the denied fallback's proceed-anyway both land here
// (they are intentionally indistinguishable to the gate — see the semantics
// note above). Optimistic: the store flips before the write settles, so the
// gate moves on immediately.
export const markPermissionStepHandled = async (): Promise<void> => {
  usePermissionStore.setState({
    permissionStep: { status: 'ready', hasHandledPermissionStep: true },
  });
  try {
    await AsyncStorage.setItem(PERMISSION_STEP_HANDLED_STORAGE_KEY, 'true');
  } catch {
    // Fail open — see header comment.
  }
};
