module.exports = {
  preset: '@react-native/jest-preset',
  // The RN preset only transforms react-native itself; these ship untranspiled
  // ESM/JSX and must not be ignored by Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-is-edge-to-edge)/)',
  ],
};
