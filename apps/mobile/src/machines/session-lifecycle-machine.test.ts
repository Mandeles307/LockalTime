import { createActor } from 'xstate';

import { SessionLifecycleMachine } from './session-lifecycle-machine';

// Phase 0 wiring test for a placeholder XState machine. The real session
// lifecycle graph (host_disconnected, degraded_offline, etc. per
// ARCHITECTURE.md §6) lands in Phases 2/4; this only proves XState is
// installed and the machine-as-module pattern (kebab-case file, PascalCase
// machine export) is testable.
describe('SessionLifecycleMachine', () => {
  it('starts in the idle state', () => {
    const actor = createActor(SessionLifecycleMachine).start();

    expect(actor.getSnapshot().value).toBe('idle');
    actor.stop();
  });

  it('transitions from idle to active on SESSION_STARTED', () => {
    const actor = createActor(SessionLifecycleMachine).start();

    actor.send({ type: 'SESSION_STARTED' });

    expect(actor.getSnapshot().value).toBe('active');
    actor.stop();
  });

  it('ignores SESSION_STARTED when already active', () => {
    const actor = createActor(SessionLifecycleMachine).start();
    actor.send({ type: 'SESSION_STARTED' });

    actor.send({ type: 'SESSION_STARTED' });

    expect(actor.getSnapshot().value).toBe('active');
    actor.stop();
  });
});
