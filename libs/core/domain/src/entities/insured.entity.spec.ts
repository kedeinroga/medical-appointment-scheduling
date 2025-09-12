import { Insured } from './insured.entity';
import { CountryISO } from '../value-objects/country-iso.vo';
import { InsuredId } from '../value-objects/insured-id.vo';

describe('Insured', () => {
  describe('create', () => {
    it('should create insured with value objects', () => {
      // Arrange
      const countryISO = CountryISO.fromString('PE');
      const insuredId = InsuredId.fromString('12345');

      // Act
      const insured = Insured.create({
        countryISO,
        insuredId
      });

      // Assert
      expect(insured.getCountryISO()).toBe(countryISO);
      expect(insured.getInsuredId()).toBe(insuredId);
    });
  });

  describe('fromPrimitives', () => {
    it('should create insured from primitive values', () => {
      // Arrange
      const data = {
        countryISO: 'CL',
        insuredId: '67890'
      };

      // Act
      const insured = Insured.fromPrimitives(data);

      // Assert
      expect(insured.getCountryISO().getValue()).toBe('CL');
      expect(insured.getInsuredId().getValue()).toBe('67890');
    });

    it('should handle padded insured ID', () => {
      // Arrange
      const data = {
        countryISO: 'PE',
        insuredId: '123'
      };

      // Act
      const insured = Insured.fromPrimitives(data);

      // Assert
      expect(insured.getInsuredId().getValue()).toBe('00123');
    });
  });

  describe('equals', () => {
    it('should return true for insured with same values', () => {
      // Arrange
      const insured1 = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '12345'
      });
      const insured2 = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '12345'
      });

      // Act & Assert
      expect(insured1.equals(insured2)).toBe(true);
    });

    it('should return false for insured with different countries', () => {
      // Arrange
      const insured1 = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '12345'
      });
      const insured2 = Insured.fromPrimitives({
        countryISO: 'CL',
        insuredId: '12345'
      });

      // Act & Assert
      expect(insured1.equals(insured2)).toBe(false);
    });

    it('should return false for insured with different IDs', () => {
      // Arrange
      const insured1 = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '12345'
      });
      const insured2 = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '67890'
      });

      // Act & Assert
      expect(insured1.equals(insured2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize insured to JSON', () => {
      // Arrange
      const insured = Insured.fromPrimitives({
        countryISO: 'CL',
        insuredId: '67890'
      });

      // Act
      const json = insured.toJSON();

      // Assert
      expect(json).toEqual({
        countryISO: 'CL',
        insuredId: '67890'
      });
    });
  });

  describe('toLogSafeJSON', () => {
    it('should serialize insured with masked ID', () => {
      // Arrange
      const insured = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '12345'
      });

      // Act
      const json = insured.toLogSafeJSON();

      // Assert
      expect(json).toEqual({
        countryISO: 'PE',
        insuredId: '12***'
      });
    });

    it('should mask padded insured ID correctly', () => {
      // Arrange
      const insured = Insured.fromPrimitives({
        countryISO: 'CL',
        insuredId: '123'
      });

      // Act
      const json = insured.toLogSafeJSON();

      // Assert
      expect(json).toEqual({
        countryISO: 'CL',
        insuredId: '00***'
      });
    });
  });
});
