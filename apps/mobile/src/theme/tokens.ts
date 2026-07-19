// Design tokens mirroring docs/DESIGN_GUIDELINES.md — §2 spacing scale, §3
// corner radius scale, §5 typography ramp (1.4x line height, no exceptions),
// §6 component sizing standards. Screens style from these tokens only, never
// ad-hoc values (tokens.test.ts locks the numbers). Color and elevation
// tokens are intentionally absent: the palette is deferred (§11) and §4's
// "subtle shadow" definition depends on it — both land with the palette pass.

const LINE_HEIGHT_RATIO = 1.4;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Weights as RN numeric strings: '700' Bold, '600' Semibold, '400' Regular.
// Typeface stays the OS system font (§5) — no fontFamily token needed.
export const typography = {
  display: { fontSize: 28, fontWeight: '700', lineHeight: 28 * LINE_HEIGHT_RATIO },
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 20 * LINE_HEIGHT_RATIO },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 16 * LINE_HEIGHT_RATIO },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 16 * LINE_HEIGHT_RATIO },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 13 * LINE_HEIGHT_RATIO },
} as const;

export const sizing = {
  // The stricter of iOS 44pt / Android 48dp, applied everywhere (§6).
  minTouchTarget: 48,
  buttonHeight: 52,
  inputHeight: 48,
  iconStandard: 24,
  iconLarge: 28,
  avatarParticipant: 36,
} as const;
