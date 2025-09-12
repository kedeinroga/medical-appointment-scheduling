module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@medical-appointment/core-domain$': '<rootDir>/../domain/src',
    '^@medical-appointment/core-domain/(.*)$': '<rootDir>/../domain/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/../../../jest.setup.ts']
};
