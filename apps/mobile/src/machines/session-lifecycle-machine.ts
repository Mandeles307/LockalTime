import { setup } from 'xstate';

type SessionLifecycleEvent = { type: 'SESSION_STARTED' };

// Phase 0 placeholder proving XState v5 wiring. The real lifecycle graph
// (pending | active | host_disconnected | degraded_offline | force_terminated
// per ARCHITECTURE.md §6) replaces this in Phases 2/4.
export const SessionLifecycleMachine = setup({
  types: {
    events: {} as SessionLifecycleEvent,
  },
}).createMachine({
  id: 'sessionLifecycle',
  initial: 'idle',
  states: {
    idle: {
      on: {
        SESSION_STARTED: { target: 'active' },
      },
    },
    active: {},
  },
});
