import {
  BusinessException,
  AppointmentNotFoundError,
  UnsupportedCountryError,
  InvalidInsuredIdError,
  ValidationError
} from '../business.exceptions';

describe('Business Exceptions - Complete Coverage', () => {
  describe('AppointmentNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const appointmentId = 'test-appointment-123';
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.message).toBe('Appointment with ID test-appointment-123 not found');
      expect(error.name).toBe('AppointmentNotFoundError');
      expect(error).toBeInstanceOf(BusinessException);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle empty appointment ID', () => {
      const error = new AppointmentNotFoundError('');

      expect(error.message).toBe('Appointment with ID  not found');
      expect(error.name).toBe('AppointmentNotFoundError');
    });

    it('should handle special characters in appointment ID', () => {
      const appointmentId = 'test-@#$%^&*()';
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.message).toBe('Appointment with ID test-@#$%^&*() not found');
      expect(error.name).toBe('AppointmentNotFoundError');
    });
  });

  describe('UnsupportedCountryError', () => {
    it('should create error with correct message and name', () => {
      const countryISO = 'US';
      const error = new UnsupportedCountryError(countryISO);

      expect(error.message).toBe('Country US is not supported. Only PE and CL are allowed');
      expect(error.name).toBe('UnsupportedCountryError');
      expect(error).toBeInstanceOf(BusinessException);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle lowercase country code', () => {
      const error = new UnsupportedCountryError('br');

      expect(error.message).toBe('Country br is not supported. Only PE and CL are allowed');
      expect(error.name).toBe('UnsupportedCountryError');
    });

    it('should handle empty country code', () => {
      const error = new UnsupportedCountryError('');

      expect(error.message).toBe('Country  is not supported. Only PE and CL are allowed');
      expect(error.name).toBe('UnsupportedCountryError');
    });

    it('should handle numeric country code', () => {
      const error = new UnsupportedCountryError('123');

      expect(error.message).toBe('Country 123 is not supported. Only PE and CL are allowed');
      expect(error.name).toBe('UnsupportedCountryError');
    });
  });

  describe('InvalidInsuredIdError', () => {
    it('should create error with correct message and name', () => {
      const insuredId = '123';
      const error = new InvalidInsuredIdError(insuredId);

      expect(error.message).toBe('Invalid insured ID: 123. Must be exactly 5 digits');
      expect(error.name).toBe('InvalidInsuredIdError');
      expect(error).toBeInstanceOf(BusinessException);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle long insured ID', () => {
      const error = new InvalidInsuredIdError('123456789');

      expect(error.message).toBe('Invalid insured ID: 123456789. Must be exactly 5 digits');
      expect(error.name).toBe('InvalidInsuredIdError');
    });

    it('should handle empty insured ID', () => {
      const error = new InvalidInsuredIdError('');

      expect(error.message).toBe('Invalid insured ID: . Must be exactly 5 digits');
      expect(error.name).toBe('InvalidInsuredIdError');
    });

    it('should handle non-numeric insured ID', () => {
      const error = new InvalidInsuredIdError('abcde');

      expect(error.message).toBe('Invalid insured ID: abcde. Must be exactly 5 digits');
      expect(error.name).toBe('InvalidInsuredIdError');
    });
  });

  describe('ValidationError', () => {
    it('should create error with correct message and name', () => {
      const field = 'email';
      const message = 'must be a valid email address';
      const error = new ValidationError(field, message);

      expect(error.message).toBe('Validation error for email: must be a valid email address');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(BusinessException);
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle empty field name', () => {
      const error = new ValidationError('', 'is required');

      expect(error.message).toBe('Validation error for : is required');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle empty validation message', () => {
      const error = new ValidationError('password', '');

      expect(error.message).toBe('Validation error for password: ');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle special characters in field and message', () => {
      const error = new ValidationError('user@name', 'must not contain @ symbol');

      expect(error.message).toBe('Validation error for user@name: must not contain @ symbol');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle numeric field name', () => {
      const error = new ValidationError('123', 'must be alphabetic');

      expect(error.message).toBe('Validation error for 123: must be alphabetic');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('BusinessException base class', () => {
    // Test the abstract base class through concrete implementations
    it('should set correct properties when extended', () => {
      const error = new AppointmentNotFoundError('test-id');

      expect(error).toBeInstanceOf(BusinessException);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.stack).toBeDefined();
    });

    it('should maintain error prototype chain', () => {
      const error = new UnsupportedCountryError('XX');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof BusinessException).toBe(true);
      expect(error instanceof UnsupportedCountryError).toBe(true);
    });

    it('should be catchable as Error', () => {
      expect(() => {
        throw new ValidationError('test', 'test message');
      }).toThrow(Error);
    });

    it('should be catchable as BusinessException', () => {
      expect(() => {
        throw new InvalidInsuredIdError('invalid');
      }).toThrow('Invalid insured ID: invalid. Must be exactly 5 digits');
    });
  });

  describe('Error inheritance and polymorphism', () => {
    it('should work with instanceof checks', () => {
      const errors = [
        new AppointmentNotFoundError('123'),
        new UnsupportedCountryError('XX'),
        new InvalidInsuredIdError('abc'),
        new ValidationError('field', 'message')
      ];

      errors.forEach(error => {
        expect(error instanceof Error).toBe(true);
        expect(error instanceof BusinessException).toBe(true);
      });
    });

    it('should have unique names for each exception type', () => {
      const errors = [
        new AppointmentNotFoundError('123'),
        new UnsupportedCountryError('XX'),
        new InvalidInsuredIdError('abc'),
        new ValidationError('field', 'message')
      ];

      const names = errors.map(error => error.name);
      const uniqueNames = [...new Set(names)];
      
      expect(names).toHaveLength(4);
      expect(uniqueNames).toHaveLength(4);
    });

    it('should handle error serialization', () => {
      const error = new AppointmentNotFoundError('test-123');
      
      // Test JSON serialization
      const errorObj = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      const serialized = JSON.stringify(errorObj);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toBe(error.message);
      expect(parsed.name).toBe(error.name);
    });
  });
});
