import { useAppStore } from './app-store';

// Phase 0 wiring test for the minimal Zustand app-state store. The store's
// only Phase 0 state is an app-readiness flag; the point is proving the
// create/read/update/subscribe pattern works outside React, so feature
// stores in later phases follow an already-tested shape.
describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ isAppReady: false });
  });

  it('starts with isAppReady false', () => {
    expect(useAppStore.getState().isAppReady).toBe(false);
  });

  it('marks the app ready when setAppReady(true) is called', () => {
    useAppStore.getState().setAppReady(true);

    expect(useAppStore.getState().isAppReady).toBe(true);
  });

  it('notifies subscribers when state changes', () => {
    const listener = jest.fn();
    const unsubscribe = useAppStore.subscribe(listener);

    useAppStore.getState().setAppReady(true);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
