import { InsuredId } from './insured-id.vo';

describe('InsuredId', () => {
  describe('fromString', () => {
    it('should create insured ID from valid 5-digit string', () => {
      // Arrange & Act
      const insuredId = InsuredId.fromString('12345');

      // Assert
      expect(insuredId.getValue()).toBe('12345');
    });

    it('should pad with leading zeros for shorter strings', () => {
      // Arrange & Act
      const insuredId = InsuredId.fromString('123');

      // Assert
      expect(insuredId.getValue()).toBe('00123');
    });

    it('should handle single digit', () => {
      // Arrange & Act
      const insuredId = InsuredId.fromString('1');

      // Assert
      expect(insuredId.getValue()).toBe('00001');
    });

    it('should remove non-digit characters', () => {
      // Arrange & Act
      const insuredId = InsuredId.fromString('1a2b3c');

      // Assert
      expect(insuredId.getValue()).toBe('00123');
    });

    it('should throw error for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => InsuredId.fromString(emptyString)).toThrow(
        'Insured ID cannot be empty'
      );
    });

    it('should throw error for string longer than 5 digits', () => {
      // Arrange
      const longString = '123456';

      // Act & Assert
      expect(() => InsuredId.fromString(longString)).toThrow(
        'Insured ID cannot be longer than 5 digits'
      );
    });

    it('should throw error for string with only non-digit characters that results in empty after cleaning', () => {
      // Arrange
      const nonDigitString = 'abcde';

      // Act & Assert
      expect(() => InsuredId.fromString(nonDigitString)).toThrow(
        'Insured ID must contain at least one digit'
      );
    });
  });

  describe('equals', () => {
    it('should return true for insured IDs with same value', () => {
      // Arrange
      const insuredId1 = InsuredId.fromString('12345');
      const insuredId2 = InsuredId.fromString('12345');

      // Act & Assert
      expect(insuredId1.equals(insuredId2)).toBe(true);
    });

    it('should return false for insured IDs with different values', () => {
      // Arrange
      const insuredId1 = InsuredId.fromString('12345');
      const insuredId2 = InsuredId.fromString('67890');

      // Act & Assert
      expect(insuredId1.equals(insuredId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const insuredId = InsuredId.fromString('12345');

      // Act & Assert
      expect(insuredId.toString()).toBe('12345');
    });
  });

  describe('getMaskedValue', () => {
    it('should return masked value with first 2 digits visible', () => {
      // Arrange
      const insuredId = InsuredId.fromString('12345');

      // Act & Assert
      expect(insuredId.getMaskedValue()).toBe('12***');
    });

    it('should mask padded insured ID correctly', () => {
      // Arrange
      const insuredId = InsuredId.fromString('123');

      // Act & Assert
      expect(insuredId.getMaskedValue()).toBe('00***');
    });
  });
});
