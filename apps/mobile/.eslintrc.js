module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['i18next'],
  rules: {
    // No hardcoded UI strings (CLAUDE.md locked decision): all user-visible
    // copy flows through the i18n layer. 'jsx-only' validates JSX text plus
    // attributes; the include list scopes attribute checks to user-facing
    // props only, so non-copy attributes (testID, navigator route names)
    // stay unflagged.
    'i18next/no-literal-string': [
      'error',
      {
        mode: 'jsx-only',
        'jsx-attributes': {
          include: ['accessibilityLabel', 'accessibilityHint', 'placeholder', 'title', 'label'],
        },
      },
    ],
  },
  overrides: [
    {
      // Tests assert against literals (testIDs, fixture strings) by design.
      files: ['**/*.test.ts', '**/*.spec.tsx', '__tests__/**'],
      rules: {
        'i18next/no-literal-string': 'off',
      },
    },
  ],
};
