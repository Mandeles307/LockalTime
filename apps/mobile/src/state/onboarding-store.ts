import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Phase 1 first-launch gating (Screen 1), mirroring the Zustand pattern
// proven in app-store.ts. The gate is a discriminated union
// (.claude/skills/typescript-strictness/SKILL.md): App cannot read a seen/unseen answer
// before AsyncStorage has actually been consulted, so a cold start can never
// flash the wrong screen.
//
// Failure policy (pinned in onboarding-store.test.ts): fail open. A storage
// read failure hydrates as unseen and a persistence failure still marks seen
// in-memory — the worst case is a returning user seeing onboarding once more,
// while failing closed would strand the app in the gate.

// Renaming this key would silently orphan every persisted flag — it is pinned
// by test on purpose.
export const ONBOARDING_SEEN_STORAGE_KEY = '@lockal-time/onboarding-seen';

export type OnboardingGate =
  | { readonly status: 'hydrating' }
  | { readonly status: 'ready'; readonly hasSeenOnboarding: boolean };

interface OnboardingState {
  onboarding: OnboardingGate;
}

export const useOnboardingStore = create<OnboardingState>()(() => ({
  onboarding: { status: 'hydrating' },
}));

// Reads the persisted flag into the store; the App bootstrap calls this once
// per mount. Any value other than the exact 'true' written by
// markOnboardingSeen (including corruption) counts as unseen.
export const hydrateOnboardingStatus = async (): Promise<void> => {
  let hasSeenOnboarding = false;
  try {
    hasSeenOnboarding = (await AsyncStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY)) === 'true';
  } catch {
    // Fail open — see header comment.
  }
  useOnboardingStore.setState({ onboarding: { status: 'ready', hasSeenOnboarding } });
};

// Completing or skipping onboarding both land here (they are intentionally
// indistinguishable to the gate). Optimistic: the store flips before the
// write settles, so the gate moves on immediately.
export const markOnboardingSeen = async (): Promise<void> => {
  useOnboardingStore.setState({ onboarding: { status: 'ready', hasSeenOnboarding: true } });
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, 'true');
  } catch {
    // Fail open — see header comment.
  }
};
