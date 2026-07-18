import { create } from 'zustand';

interface AppState {
  isAppReady: boolean;
  setAppReady: (isAppReady: boolean) => void;
}

// Minimal Phase 0 app-state store proving the Zustand wiring pattern.
// Feature state (sessions, auth) gets its own stores in later phases.
export const useAppStore = create<AppState>()((set) => ({
  isAppReady: false,
  setAppReady: (isAppReady: boolean): void => {
    set({ isAppReady });
  },
}));
