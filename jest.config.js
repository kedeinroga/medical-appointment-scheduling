module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/functions', '<rootDir>/libs'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'functions/**/*.ts',
    'libs/**/*.ts',
    '!**/*.d.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@medical-appointment/core-domain$': '<rootDir>/libs/core/domain/src',
    '^@medical-appointment/core-use-cases$': '<rootDir>/libs/core/use-cases/src',
    '^@medical-appointment/shared$': '<rootDir>/libs/shared/src',
    '^@medical-appointment/infrastructure$': '<rootDir>/libs/infrastructure/src'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 30000
};
