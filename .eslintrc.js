module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    
    // Clean Architecture rules
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    
    // Imports organization
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': true,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
      'allowSeparatedGroups': true
    }],
    
    // Medical domain specific
    'no-magic-numbers': ['error', { 
      ignore: [0, 1, -1],
      ignoreArrayIndexes: true,
      enforceConst: true
    }],
    
    // Prettier integration
    'prettier/prettier': 'error'
  },
  env: {
    node: true,
    jest: true,
    es2022: true
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '*.d.ts'
  ]
};
