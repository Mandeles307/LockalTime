import React from 'react';

import { render, screen } from '@testing-library/react-native';

import App from './App';

// Phase 0 scaffold smoke test: proves the RN app boots with React Navigation
// wired and lands on the Home placeholder. Asserts via testID, not visible
// text — i18n (en+he) is a Phase 1 item and UI strings are not part of this
// contract; color palette is deferred, so no style/color assertions either.
describe('App', () => {
  it('renders the Home placeholder screen as the initial route', async () => {
    // RNTL v14 render is async (returns a Promise) — must be awaited.
    await render(<App />);

    // findBy* awaits React Navigation's async mount of the initial screen.
    expect(await screen.findByTestId('home-screen')).toBeOnTheScreen();
  });
});
