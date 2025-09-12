/**
 * Test constants for shared utilities
 */

export const TEST_PII_DATA = {
  VALID_INSURED_IDS: ['12345', '00123', '99999'],
  INVALID_INSURED_IDS: ['123', '123456', '', 'abcde'],
  VALID_PHONE_NUMBERS: ['987654321', '98765432', '1234567890'],
  INVALID_PHONE_NUMBERS: ['123', '', '12ab'],
  VALID_EMAILS: ['john.doe@example.com', 'test@domain.org', 'user@company.co'],
  INVALID_EMAILS: ['invalid-email', '', 'test@', '@domain.com']
} as const;

export const EXPECTED_MASKS = {
  INSURED_ID: {
    VALID: '12***',
    INVALID: '***',
    NON_NUMERIC: 'ab***' // 'abcde' becomes 'ab***'
  },
  PHONE: {
    NINE_DIGITS: '98*****21',
    EIGHT_DIGITS: '98****32',
    FOUR_DIGITS: '****',
    INVALID: '***',
    NON_NUMERIC_FOUR: '****' // '12ab' becomes '****' (4 chars)
  },
  EMAIL: {
    REGULAR: 'jo***@ex***',
    SHORT_DOMAIN: '***@cd***',
    SINGLE_CHAR: '***@b.***',
    INVALID: '***@***'
  }
} as const;
