import { radius, sizing, spacing, typography } from './tokens';

// Locks the numeric design language of docs/DESIGN_GUIDELINES.md into
// executable form: §2 spacing scale, §3 radius scale, §5 typography ramp with
// the 1.4x line-height rule, §6 component sizing standards. Screens consume
// these tokens instead of ad-hoc values; any drift from the guideline numbers
// fails here. Whole-object toEqual assertions double as completeness checks —
// a token silently added, removed, or renamed outside the documented scale
// fails the exact-shape match. Deliberately absent: color tokens (palette is
// deferred, §11) and the elevation scale (§4's "subtle shadow" definition is
// palette-dependent — added with the color pass, or when the first
// elevation-1 component lands, whichever comes first).

describe('spacing scale (DESIGN_GUIDELINES §2)', () => {
  it('matches the documented six-step scale exactly, with no extra or missing steps', () => {
    expect(spacing).toEqual({
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
    });
  });
});

describe('radius scale (DESIGN_GUIDELINES §3)', () => {
  it('matches the documented curve language exactly, with no extra or missing steps', () => {
    expect(radius).toEqual({
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    });
  });
});

describe('typography ramp (DESIGN_GUIDELINES §5)', () => {
  it('matches the documented ramp: five tokens with the documented sizes and weights', () => {
    // Weights pinned as RN numeric strings: '700' Bold, '600' Semibold,
    // '400' Regular — unambiguous across both platforms.
    expect(typography).toEqual({
      display: { fontSize: 28, fontWeight: '700', lineHeight: expect.any(Number) },
      heading: { fontSize: 20, fontWeight: '600', lineHeight: expect.any(Number) },
      body: { fontSize: 16, fontWeight: '400', lineHeight: expect.any(Number) },
      bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: expect.any(Number) },
      caption: { fontSize: 13, fontWeight: '400', lineHeight: expect.any(Number) },
    });
  });

  it('uses a 1.4x line height on every token, no exceptions', () => {
    // Explicit property access (not Object.entries) keeps each token fully
    // typed; the exact-shape assertion above already guards the key set.
    const ramp = [
      typography.display,
      typography.heading,
      typography.body,
      typography.bodyStrong,
      typography.caption,
    ];

    ramp.forEach((token) => {
      // toBeCloseTo tolerates float representation of the same ratio (e.g. a
      // hardcoded 39.2 vs a computed 28 * 1.4) while still failing any other
      // ratio.
      expect(token.lineHeight).toBeCloseTo(token.fontSize * 1.4, 5);
    });
  });
});

describe('component sizing standards (DESIGN_GUIDELINES §6)', () => {
  it('matches the documented sizing table exactly', () => {
    expect(sizing).toEqual({
      // 48 is the stricter of iOS 44pt / Android 48dp, applied everywhere.
      minTouchTarget: 48,
      buttonHeight: 52,
      inputHeight: 48,
      iconStandard: 24,
      iconLarge: 28,
      avatarParticipant: 36,
    });
  });
});
