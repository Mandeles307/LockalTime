// Integration suite: node environment (no React Native runtime), real local
// Supabase stack + Mailpit. Run via `npm run test:integration` with
// `npx supabase start` (full stack) up; the CI db job runs it after pgTAP.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/integration/**/*.integration.test.ts'],
  // babel-jest with the project's RN babel preset handles the TypeScript.
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
};
