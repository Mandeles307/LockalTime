import type { TranslationSchema } from './en';

// Hebrew (RTL) bundle. Typed against the en schema so key drift between the
// two locales cannot compile — "both languages from day one" (CLAUDE.md).
// The Hebrew-script brand rendering is placeholder copy; final copy comes
// with the deferred palette/copy pass.
export const he: TranslationSchema = {
  home: {
    title: 'לוקאל טיים',
  },
};
