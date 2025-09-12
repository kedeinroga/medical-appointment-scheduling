module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'handler.ts',
    'constants.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@medical-appointment/core-domain$': '<rootDir>/../../libs/core/domain/src',
    '^@medical-appointment/core-use-cases$': '<rootDir>/../../libs/core/use-cases/src',
    '^@medical-appointment/shared$': '<rootDir>/../../libs/shared/src',
    '^@medical-appointment/infrastructure$': '<rootDir>/../../libs/infrastructure/src',
  },
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['/dist/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@medical-appointment)/)',
  ],
};
