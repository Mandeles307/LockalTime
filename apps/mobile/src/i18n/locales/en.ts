// English bundle — the canonical translation schema. Every other locale is
// typed as TranslationSchema (= typeof en), so a missing or extra key in any
// locale is a compile-time error; the runtime walk in locale-parity.test.ts
// is the belt-and-braces guard on top (.claude/skills/i18n/SKILL.md). Keys nest by
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
  // Permission-priming copy (Screen 2) is PLACEHOLDER, flagged for the
  // deferred copy pass. It resolves the one "why permissions" hesitation
  // (DESIGN_GUIDELINES §9) and honestly reflects ARCHITECTURE §4: a fixed set
  // of default categories, applied only while a session runs.
  permissionPriming: {
    title: 'Allow app blocking',
    body: 'To block distracting apps for real, your phone needs a screen-time permission. It blocks a fixed set of categories — social, games, and entertainment — and only while a session you joined is running. It is never used outside a session.',
    allow: 'Allow',
    denied: {
      title: 'Permission not granted',
      body: "Without it, apps won't actually be blocked during your sessions. You can grant it any time from your phone's settings, or continue without blocking for now.",
      openSettings: 'Open settings',
      proceedAnyway: 'Continue without blocking',
    },
  },
  // Auth copy (Screen 3) is PLACEHOLDER, flagged for the deferred copy pass.
  // Error strings are user-facing copy keyed off AuthFailure.kind only — the
  // failure's diagnostic message is never rendered
  // (.claude/skills/supabase-integration/SKILL.md).
  auth: {
    title: 'Sign in to Lockal Time',
    emailEntry: {
      placeholder: 'Your email address',
      continue: 'Continue',
      errors: {
        requestFailed: "We couldn't send a code to that address. Please try again.",
      },
    },
    codeEntry: {
      title: 'Check your email',
      body: 'We sent a 6-digit code to your address. Enter it here to sign in.',
      verify: 'Verify',
      errors: {
        invalidCode: "That code isn't right or has expired. Check it and try again.",
      },
    },
    errors: {
      network: "Something went wrong reaching the server. Check your connection and try again.",
    },
    providers: {
      google: 'Continue with Google',
      apple: 'Continue with Apple',
      unavailable: 'This sign-in option is not available yet. Please continue with email.',
      error: "That sign-in didn't work. Please try again or continue with email.",
    },
    accountLinking: {
      title: 'You already have an account',
      body: 'This email is already registered with a different sign-in method. Sign in with your email to keep everything in one account.',
      useEmail: 'Sign in with email',
    },
  },
};

export type TranslationSchema = typeof en;
