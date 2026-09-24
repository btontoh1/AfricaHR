module.exports = {
  displayName: 'finance-feature',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/finance/feature',
  // @react-pdf/renderer is ESM-only and Jest's transform can't parse it -
  // see the stub's own doc comment for why a stub is safe here.
  moduleNameMapper: {
    '^@react-pdf/renderer$': '<rootDir>/tools/test/react-pdf-renderer.stub.ts',
  },
};
