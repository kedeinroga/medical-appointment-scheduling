import { CountryISO } from '../country-iso.vo';

describe('CountryISO', () => {
  describe('fromString', () => {
    it('should create Peru country ISO from "PE" string', () => {
      // Arrange & Act
      const countryISO = CountryISO.fromString('PE');

      // Assert
      expect(countryISO.getValue()).toBe('PE');
      expect(countryISO.isPeru()).toBe(true);
      expect(countryISO.isChile()).toBe(false);
    });

    it('should create Chile country ISO from "CL" string', () => {
      // Arrange & Act
      const countryISO = CountryISO.fromString('CL');

      // Assert
      expect(countryISO.getValue()).toBe('CL');
      expect(countryISO.isChile()).toBe(true);
      expect(countryISO.isPeru()).toBe(false);
    });

    it('should handle lowercase input', () => {
      // Arrange & Act
      const peruCountry = CountryISO.fromString('pe');
      const chileCountry = CountryISO.fromString('cl');

      // Assert
      expect(peruCountry.getValue()).toBe('PE');
      expect(chileCountry.getValue()).toBe('CL');
    });

    it('should throw error for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => CountryISO.fromString(emptyString)).toThrow(
        'Country ISO cannot be empty'
      );
    });

    it('should throw error for unsupported country', () => {
      // Arrange
      const unsupportedCountry = 'US';

      // Act & Assert
      expect(() => CountryISO.fromString(unsupportedCountry)).toThrow(
        'Unsupported country ISO: US. Only PE and CL are supported'
      );
    });
  });

  describe('static instances', () => {
    it('should have Peru static instance', () => {
      // Act & Assert
      expect(CountryISO.PERU.getValue()).toBe('PE');
      expect(CountryISO.PERU.isPeru()).toBe(true);
    });

    it('should have Chile static instance', () => {
      // Act & Assert
      expect(CountryISO.CHILE.getValue()).toBe('CL');
      expect(CountryISO.CHILE.isChile()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same country instances', () => {
      // Arrange
      const peru1 = CountryISO.fromString('PE');
      const peru2 = CountryISO.fromString('PE');

      // Act & Assert
      expect(peru1.equals(peru2)).toBe(true);
    });

    it('should return false for different countries', () => {
      // Arrange
      const peru = CountryISO.fromString('PE');
      const chile = CountryISO.fromString('CL');

      // Act & Assert
      expect(peru.equals(chile)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const peru = CountryISO.fromString('PE');

      // Act & Assert
      expect(peru.toString()).toBe('PE');
    });
  });
});
