// English bundle — the canonical translation schema. Every other locale is
// typed as TranslationSchema (= typeof en), so a missing or extra key in any
// locale is a compile-time error; the runtime walk in locale-parity.test.ts
// is the belt-and-braces guard on top (skills/i18n.md). Keys nest by
// screen/domain, leaf values are plain strings.
export const en = {
  home: {
    title: 'Lockal Time',
  },
  // Onboarding copy is PLACEHOLDER, flagged for the deferred copy pass. Each
  // page resolves one hesitation (DESIGN_GUIDELINES §9): why this app / how
  // sessions work / why the permission ask is coming.
  onboarding: {
    pages: {
      valueProposition: {
        title: 'Time together, undistracted',
        body: 'Lockal Time blocks distracting apps while you and your friends are actually together — so being present is the easy choice.',
      },
      howSessionsWork: {
        title: 'Sessions are simple',
        body: "Start a session or scan a friend's QR code. Distracting apps stay blocked until the session ends, and you earn points for every minute you're present.",
      },
      whyPermissionsMatter: {
        title: 'One permission makes it real',
        body: "To truly block apps, your phone requires a screen-time permission. We'll ask on the next screen — it's only ever used during a session you chose to start.",
      },
    },
    skip: 'Skip',
    next: 'Next',
    getStarted: 'Get Started',
  },
};

export type TranslationSchema = typeof en;
