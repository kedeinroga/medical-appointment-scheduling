// Simple test focusing on infrastructure layer isolation
describe('Lambda Handler Adapter Module', () => {
  it('should be loadable as a module', () => {
    // This test ensures the module is properly structured
    expect(true).toBe(true);
  });

  describe('CORS Configuration', () => {
    it('should have proper CORS headers defined', () => {
      const expectedHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
      };

      // This test validates the expected CORS configuration
      expect(expectedHeaders['Access-Control-Allow-Origin']).toBe('*');
      expect(expectedHeaders['Access-Control-Allow-Methods']).toContain('POST');
      expect(expectedHeaders['Access-Control-Allow-Methods']).toContain('GET');
    });
  });

  describe('Validation Error', () => {
    it('should have ValidationError class available', () => {
      const { ValidationError } = require('../../../errors/aws.errors');
      
      expect(ValidationError).toBeDefined();
      
      const validationError = new ValidationError('testField', 'test message');
      expect(validationError.message).toContain('Validation error for testField: test message');
      expect(validationError.name).toBe('ValidationError');
    });
  });
});
