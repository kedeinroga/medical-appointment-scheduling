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

describe('Appointment PE Schemas', () => {
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

    it('should reject record with missing messageId', () => {
      const invalidRecord = {
        body: 'test-body',
        receiptHandle: 'test-receipt-handle'
      };

      expect(() => SQSRecordSchema.parse(invalidRecord)).toThrow();
    });

    it('should reject record with empty messageId', () => {
      const invalidRecord = {
        body: 'test-body',
        messageId: '',
        receiptHandle: 'test-receipt-handle'
      };

      expect(() => SQSRecordSchema.parse(invalidRecord)).toThrow('Message ID is required');
    });

    it('should reject record with missing receiptHandle', () => {
      const invalidRecord = {
        body: 'test-body',
        messageId: 'test-message-id'
      };

      expect(() => SQSRecordSchema.parse(invalidRecord)).toThrow();
    });

    it('should reject record with empty receiptHandle', () => {
      const invalidRecord = {
        body: 'test-body',
        messageId: 'test-message-id',
        receiptHandle: ''
      };

      expect(() => SQSRecordSchema.parse(invalidRecord)).toThrow('Receipt handle is required');
    });
  });

  describe('SNSMessageSchema', () => {
    it('should validate valid SNS message', () => {
      const validMessage = {
        Type: 'Notification',
        MessageId: 'sns-message-id',
        Message: 'sns-message-content',
        Subject: 'Test Subject',
        Timestamp: '2025-09-13T10:00:00Z'
      };

      const result = SNSMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should validate SNS message without optional subject', () => {
      const validMessage = {
        Type: 'Notification',
        MessageId: 'sns-message-id',
        Message: 'sns-message-content',
        Timestamp: '2025-09-13T10:00:00Z'
      };

      const result = SNSMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should reject message with invalid Type', () => {
      const invalidMessage = {
        Type: 'InvalidType',
        MessageId: 'sns-message-id',
        Message: 'sns-message-content',
        Timestamp: '2025-09-13T10:00:00Z'
      };

      expect(() => SNSMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should reject message with empty MessageId', () => {
      const invalidMessage = {
        Type: 'Notification',
        MessageId: '',
        Message: 'sns-message-content',
        Timestamp: '2025-09-13T10:00:00Z'
      };

      expect(() => SNSMessageSchema.parse(invalidMessage)).toThrow('SNS Message ID is required');
    });

    it('should reject message with empty Message', () => {
      const invalidMessage = {
        Type: 'Notification',
        MessageId: 'sns-message-id',
        Message: '',
        Timestamp: '2025-09-13T10:00:00Z'
      };

      expect(() => SNSMessageSchema.parse(invalidMessage)).toThrow('SNS Message content is required');
    });

    it('should reject message with empty Timestamp', () => {
      const invalidMessage = {
        Type: 'Notification',
        MessageId: 'sns-message-id',
        Message: 'sns-message-content',
        Timestamp: ''
      };

      expect(() => SNSMessageSchema.parse(invalidMessage)).toThrow('Timestamp is required');
    });
  });

  describe('AppointmentPayloadSchema', () => {
    it('should validate valid appointment payload', () => {
      const validPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
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

    it('should validate appointment payload without optional metadata', () => {
      const validPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      const result = AppointmentPayloadSchema.parse(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('should reject payload with empty appointmentId', () => {
      const invalidPayload = {
        appointmentId: '',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow('Appointment ID is required');
    });

    it('should reject payload with invalid insuredId format', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '123',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow('Insured ID must be exactly 5 digits');
    });

    it('should reject payload with non-PE countryISO', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'CL',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow();
    });

    it('should reject payload with negative scheduleId', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: -1,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow('Schedule ID must be a positive integer');
    });

    it('should reject payload with zero scheduleId', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 0,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow('Schedule ID must be a positive integer');
    });

    it('should reject payload with invalid status', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'INVALID_STATUS',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow();
    });

    it('should reject payload with invalid datetime format', () => {
      const invalidPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: 'invalid-datetime'
      };

      expect(() => AppointmentPayloadSchema.parse(invalidPayload)).toThrow('Invalid datetime format for createdAt');
    });

    it('should validate all valid status values', () => {
      const validStatuses = ['PENDING', 'PROCESSING', 'PROCESSED', 'COMPLETED', 'FAILED'];

      validStatuses.forEach(status => {
        const payload = {
          appointmentId: 'apt-123',
          insuredId: '12345',
          countryISO: 'PE',
          scheduleId: 100,
          status,
          createdAt: '2025-09-13T10:00:00Z'
        };

        expect(() => AppointmentPayloadSchema.parse(payload)).not.toThrow();
      });
    });
  });

  describe('SQSEventSchema', () => {
    it('should validate valid SQS event', () => {
      const validEvent = {
        Records: [
          {
            body: 'test-body-1',
            messageId: 'test-message-id-1',
            receiptHandle: 'test-receipt-handle-1'
          },
          {
            body: 'test-body-2',
            messageId: 'test-message-id-2',
            receiptHandle: 'test-receipt-handle-2'
          }
        ]
      };

      const result = SQSEventSchema.parse(validEvent);
      expect(result).toEqual(validEvent);
    });

    it('should reject event with empty Records array', () => {
      const invalidEvent = {
        Records: []
      };

      expect(() => SQSEventSchema.parse(invalidEvent)).toThrow('At least one SQS record is required');
    });

    it('should reject event without Records', () => {
      const invalidEvent = {};

      expect(() => SQSEventSchema.parse(invalidEvent)).toThrow();
    });
  });

  describe('validation helper functions', () => {
    describe('validateSQSEvent', () => {
      it('should validate valid SQS event', () => {
        const validEvent = {
          Records: [
            {
              body: 'test-body',
              messageId: 'test-message-id',
              receiptHandle: 'test-receipt-handle'
            }
          ]
        };

        const result = validateSQSEvent(validEvent);
        expect(result).toEqual(validEvent);
      });

      it('should throw for invalid SQS event', () => {
        const invalidEvent = { Records: [] };

        expect(() => validateSQSEvent(invalidEvent)).toThrow();
      });
    });

    describe('validateSNSMessage', () => {
      it('should validate valid SNS message from JSON string', () => {
        const validMessage = {
          Type: 'Notification',
          MessageId: 'sns-message-id',
          Message: 'sns-message-content',
          Timestamp: '2025-09-13T10:00:00Z'
        };

        const messageBody = JSON.stringify(validMessage);
        const result = validateSNSMessage(messageBody);
        expect(result).toEqual(validMessage);
      });

      it('should throw for invalid JSON string', () => {
        const invalidJson = 'invalid-json';

        expect(() => validateSNSMessage(invalidJson)).toThrow();
      });

      it('should throw for invalid SNS message structure', () => {
        const invalidMessage = { Type: 'Invalid' };
        const messageBody = JSON.stringify(invalidMessage);

        expect(() => validateSNSMessage(messageBody)).toThrow();
      });
    });

    describe('validateAppointmentPayload', () => {
      it('should validate valid appointment payload from JSON string', () => {
        const validPayload = {
          appointmentId: 'apt-123',
          insuredId: '12345',
          countryISO: 'PE',
          scheduleId: 100,
          status: 'PENDING',
          createdAt: '2025-09-13T10:00:00Z'
        };

        const messageContent = JSON.stringify(validPayload);
        const result = validateAppointmentPayload(messageContent);
        expect(result).toEqual(validPayload);
      });

      it('should throw for invalid JSON string', () => {
        const invalidJson = 'invalid-json';

        expect(() => validateAppointmentPayload(invalidJson)).toThrow();
      });

      it('should throw for invalid appointment payload structure', () => {
        const invalidPayload = { appointmentId: 'apt-123' };
        const messageContent = JSON.stringify(invalidPayload);

        expect(() => validateAppointmentPayload(messageContent)).toThrow();
      });
    });
  });

  describe('type inference', () => {
    it('should properly infer SQSRecord type', () => {
      const record: SQSRecord = {
        body: 'test-body',
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle'
      };

      expect(typeof record.body).toBe('string');
      expect(typeof record.messageId).toBe('string');
      expect(typeof record.receiptHandle).toBe('string');
    });

    it('should properly infer SNSMessage type', () => {
      const message: SNSMessage = {
        Type: 'Notification',
        MessageId: 'sns-message-id',
        Message: 'sns-message-content',
        Timestamp: '2025-09-13T10:00:00Z'
      };

      expect(message.Type).toBe('Notification');
      expect(typeof message.MessageId).toBe('string');
      expect(typeof message.Message).toBe('string');
      expect(typeof message.Timestamp).toBe('string');
    });

    it('should properly infer AppointmentPayload type', () => {
      const payload: AppointmentPayload = {
        appointmentId: 'apt-123',
        insuredId: '12345',
        countryISO: 'PE',
        scheduleId: 100,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(typeof payload.appointmentId).toBe('string');
      expect(typeof payload.insuredId).toBe('string');
      expect(payload.countryISO).toBe('PE');
      expect(typeof payload.scheduleId).toBe('number');
      expect(payload.status).toBe('PENDING');
      expect(typeof payload.createdAt).toBe('string');
    });

    it('should properly infer SQSEventType type', () => {
      const event: SQSEventType = {
        Records: [
          {
            body: 'test-body',
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle'
          }
        ]
      };

      expect(Array.isArray(event.Records)).toBe(true);
      expect(event.Records.length).toBe(1);
    });
  });
});
