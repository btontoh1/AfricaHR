export default {
  displayName: 'api-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  // All spec files share one live server, one rate limiter, and one
  // database - running them in parallel workers would make the login
  // throttle test and cross-file DB state race unpredictably.
  maxWorkers: 1,
  // login()'s retry-with-backoff on 429 legitimately waits out the login
  // throttle's 60s window - Jest's default 5s per-test timeout would kill
  // a perfectly correct test mid-retry.
  testTimeout: 120_000,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/api-e2e',
};
