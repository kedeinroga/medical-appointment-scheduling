import {
  SQSRecordSchema,
  SNSMessageSchema,
  AppointmentPayloadSchema,
  SQSEventSchema,
  validateSQSEvent,
  validateSNSMessage,
  validateAppointmentPayload,
  SQSRecord,
  SNSMessage,
  AppointmentPayload,
  SQSEventType
} from '../schemas';

describe('Appointment CL Schemas', () => {
  describe('SQSRecordSchema', () => {
    it('should validate valid SQS record', () => {
      const validRecord = {
        body: 'test-body',
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle'
      };

      const result = SQSRecordSchema.parse(validRecord);
      expect(result).toEqual(validRecord);
    });

    it('should reject record with empty body', () => {
      const invalidRecord = {
        body: '',
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle'
      };

      expect(() => SQSRecordSchema.parse(invalidRecord)).toThrow('SQS record body cannot be empty');
    });
  });

  describe('AppointmentPayloadSchema', () => {
    it('should validate valid appointment payload for CL', () => {
      const validPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'CL',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z',
        metadata: {
          source: 'api',
          version: '1.0'
        }
      };

      const result = AppointmentPayloadSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('should reject payload with non-CL countryISO', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow();
    });

    it('should validate all valid status values', () => {
      const validStatuses = ['PENDING', 'PROCESSING', 'PROCESSED', 'COMPLETED', 'FAILED'];

      validStatuses.forEach(status => {
        const payload = {
          appointmentId: 'apt-123',
          insuredId: '12345',
          countryISO: 'CL',
          scheduleId: 100,
          status,
          createdAt: '2025-09-13T10:00:00Z'
        };

        expect(() => AppointmentPayloadSchema.parse(payload)).not.toThrow();
      });
    });
  });

  describe('validation helper functions', () => {
    describe('validateAppointmentPayload', () => {
      it('should validate valid CL appointment payload from JSON string', () => {
        const validPayload = {
          appointmentId: 'apt-123',
          insuredId: '12345',
          countryISO: 'CL',
          scheduleId: 100,
          status: 'PENDING',
          createdAt: '2025-09-13T10:00:00Z'
        };

        const messageContent = JSON.stringify(validPayload);
        const result = validateAppointmentPayload(messageContent);
        expect(result).toEqual(validPayload);
      });
    });
  });

  describe('type inference', () => {
    it('should properly infer AppointmentPayload type for CL', () => {
      const payload: AppointmentPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'CL',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(typeof payload.appointmentId).toBe('string');
      expect(typeof payload.insuredId).toBe('string');
      expect(payload.countryISO).toBe('CL');
      expect(typeof payload.scheduleId).toBe('number');
      expect(payload.status).toBe('PENDING');
      expect(typeof payload.createdAt).toBe('string');
    });
  });
});
