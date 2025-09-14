import {
  validateSNSMessage,
  validateAppointmentPayload,
  SNSMessageSchema,
  AppointmentPayloadSchema
} from '../schemas';

describe('CL Schemas Validation Functions', () => {
  describe('validateSNSMessage', () => {
    it('should validate SNS message string successfully', () => {
      const validSNSMessage = JSON.stringify({
        Type: 'Notification',
        MessageId: 'test-message-id',
        Message: 'test-content',
        Timestamp: '2024-01-01T10:00:00Z'
      });

      const result = validateSNSMessage(validSNSMessage);
      
      expect(result.Type).toBe('Notification');
      expect(result.MessageId).toBe('test-message-id');
      expect(result.Message).toBe('test-content');
    });

    it('should throw error for invalid SNS message string', () => {
      const invalidSNSMessage = JSON.stringify({
        Type: 'InvalidType',
        MessageId: 'test-message-id'
        // Missing required fields
      });

      expect(() => {
        validateSNSMessage(invalidSNSMessage);
      }).toThrow();
    });
  });

  describe('validateAppointmentPayload', () => {
    it('should validate appointment payload string successfully', () => {
      const validPayload = JSON.stringify({
        appointmentId: 'test-id',
        insuredId: '12345',
        countryISO: 'CL',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2024-01-01T10:00:00Z'
      });

      const result = validateAppointmentPayload(validPayload);
      
      expect(result.appointmentId).toBe('test-id');
      expect(result.countryISO).toBe('CL');
      expect(result.scheduleId).toBe(100);
    });

    it('should throw error for invalid appointment payload', () => {
      const invalidPayload = JSON.stringify({
        appointmentId: 'test-id',
        insuredId: '123', // Invalid format
        countryISO: 'PE' // Wrong country for CL
      });

      expect(() => {
        validateAppointmentPayload(invalidPayload);
      }).toThrow();
    });

    it('should validate appointment payload with optional metadata', () => {
      const payloadWithMetadata = JSON.stringify({
        appointmentId: 'test-id',
        insuredId: '12345',
        countryISO: 'CL',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2024-01-01T10:00:00Z',
        metadata: {
          source: 'test-source',
          version: '1.0.0'
        }
      });

      const result = validateAppointmentPayload(payloadWithMetadata);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.source).toBe('test-source');
      expect(result.metadata?.version).toBe('1.0.0');
    });
  });

  describe('Schema parsing edge cases', () => {
    it('should handle SNS message with optional Subject', () => {
      const snsWithSubject = {
        Type: 'Notification' as const,
        MessageId: 'test-message-id',
        Message: 'test-content',
        Subject: 'Test Subject',
        Timestamp: '2024-01-01T10:00:00Z'
      };

      const result = SNSMessageSchema.parse(snsWithSubject);
      expect(result.Subject).toBe('Test Subject');
    });

    it('should validate all appointment statuses', () => {
      const statuses = ['PENDING', 'PROCESSING', 'PROCESSED', 'COMPLETED', 'FAILED'];
      
      statuses.forEach(status => {
        const payload = {
          appointmentId: 'test-id',
          insuredId: '12345',
          countryISO: 'CL' as const,
          scheduleId: 100,
          status: status as any,
          createdAt: '2024-01-01T10:00:00Z'
        };

        expect(() => AppointmentPayloadSchema.parse(payload)).not.toThrow();
      });
    });

    it('should reject invalid appointment status', () => {
      const payload = {
        appointmentId: 'test-id',
        insuredId: '12345',
        countryISO: 'CL' as const,
        scheduleId: 100,
        status: 'INVALID_STATUS',
        createdAt: '2024-01-01T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(payload)).toThrow();
    });
  });
});
