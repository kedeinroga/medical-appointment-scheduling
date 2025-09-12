import { maskInsuredId, maskPhoneNumber, maskEmail } from '../pii-masking.util';
import { TEST_PII_DATA, EXPECTED_MASKS } from './test.constants';

describe('PII Masking Utilities', () => {
  describe(maskInsuredId.name, () => {
    it('should mask a valid 5-digit insured ID correctly', () => {
      // Arrange & Act & Assert
      expect(maskInsuredId(TEST_PII_DATA.VALID_INSURED_IDS[0])).toBe(EXPECTED_MASKS.INSURED_ID.VALID);
    });

    it('should return *** for invalid length insured IDs', () => {
      // Arrange & Act & Assert
      expect(maskInsuredId(TEST_PII_DATA.INVALID_INSURED_IDS[0])).toBe(EXPECTED_MASKS.INSURED_ID.INVALID); // '123'
      expect(maskInsuredId(TEST_PII_DATA.INVALID_INSURED_IDS[1])).toBe(EXPECTED_MASKS.INSURED_ID.INVALID); // '123456'
    });

    it('should return *** for empty string', () => {
      // Arrange & Act & Assert
      expect(maskInsuredId(TEST_PII_DATA.INVALID_INSURED_IDS[2])).toBe(EXPECTED_MASKS.INSURED_ID.INVALID); // ''
    });

    it('should return *** for non-numeric insured ID', () => {
      // Arrange & Act & Assert
      expect(maskInsuredId(TEST_PII_DATA.INVALID_INSURED_IDS[3])).toBe(EXPECTED_MASKS.INSURED_ID.NON_NUMERIC); // 'abcde'
    });
  });

  describe(maskPhoneNumber.name, () => {
    it('should mask a 9-digit phone number correctly', () => {
      // Arrange & Act & Assert
      expect(maskPhoneNumber(TEST_PII_DATA.VALID_PHONE_NUMBERS[0])).toBe(EXPECTED_MASKS.PHONE.NINE_DIGITS); // '987654321'
    });

    it('should mask an 8-digit phone number correctly', () => {
      // Arrange & Act & Assert
      expect(maskPhoneNumber(TEST_PII_DATA.VALID_PHONE_NUMBERS[1])).toBe(EXPECTED_MASKS.PHONE.EIGHT_DIGITS); // '98765432'
    });

    it('should return *** for short phone numbers', () => {
      // Arrange & Act & Assert
      expect(maskPhoneNumber(TEST_PII_DATA.INVALID_PHONE_NUMBERS[0])).toBe(EXPECTED_MASKS.PHONE.INVALID); // '123'
    });

    it('should mask all characters for 4-digit phone numbers', () => {
      // Arrange & Act & Assert
      expect(maskPhoneNumber('1234')).toBe(EXPECTED_MASKS.PHONE.FOUR_DIGITS);
    });

    it('should return *** for empty phone number', () => {
      // Arrange & Act & Assert
      expect(maskPhoneNumber(TEST_PII_DATA.INVALID_PHONE_NUMBERS[1])).toBe(EXPECTED_MASKS.PHONE.INVALID); // ''
    });

    it('should return *** for non-numeric phone number', () => {
      // Arrange & Act & Assert
      expect(maskPhoneNumber(TEST_PII_DATA.INVALID_PHONE_NUMBERS[2])).toBe(EXPECTED_MASKS.PHONE.NON_NUMERIC_FOUR); // '12ab'
    });
  });

  describe(maskEmail.name, () => {
    it('should mask a regular email correctly', () => {
      // Arrange & Act & Assert
      expect(maskEmail(TEST_PII_DATA.VALID_EMAILS[0])).toBe(EXPECTED_MASKS.EMAIL.REGULAR); // 'john.doe@example.com'
    });

    it('should mask short username and domain correctly', () => {
      // Arrange & Act & Assert
      expect(maskEmail('ab@cd.com')).toBe(EXPECTED_MASKS.EMAIL.SHORT_DOMAIN);
    });

    it('should return default mask for invalid email formats', () => {
      // Arrange & Act & Assert
      expect(maskEmail(TEST_PII_DATA.INVALID_EMAILS[0])).toBe(EXPECTED_MASKS.EMAIL.INVALID); // 'invalid-email'
      expect(maskEmail(TEST_PII_DATA.INVALID_EMAILS[1])).toBe(EXPECTED_MASKS.EMAIL.INVALID); // ''
    });

    it('should handle single character username and domain', () => {
      // Arrange & Act & Assert
      expect(maskEmail('a@b.com')).toBe(EXPECTED_MASKS.EMAIL.SINGLE_CHAR);
    });

    it('should handle incomplete email formats', () => {
      // Arrange & Act & Assert
      expect(maskEmail(TEST_PII_DATA.INVALID_EMAILS[2])).toBe(EXPECTED_MASKS.EMAIL.INVALID); // 'test@'
      expect(maskEmail(TEST_PII_DATA.INVALID_EMAILS[3])).toBe(EXPECTED_MASKS.EMAIL.INVALID); // '@domain.com'
    });
  });
});
