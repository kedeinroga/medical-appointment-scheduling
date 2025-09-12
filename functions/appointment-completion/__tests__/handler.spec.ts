import { SQSEvent, Context } from 'aws-lambda';

// Mock AWS Lambda Powertools Logger
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the use case factory
jest.mock('@medical-appointment/infrastructure', () => ({
  UseCaseFactory: {
    createCompleteAppointmentUseCase: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        appointmentId: 'test-id',
        countryISO: 'PE',
        status: 'completed',
        message: 'Appointment completed successfully'
      })
    })
  }
}));

// Import after mocking
import { main } from '../handler';

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'appointment-completion',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:appointment-completion',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/appointment-completion',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {}
};

const createSQSEvent = (messageBody: any): SQSEvent => ({
  Records: [
    {
      messageId: 'test-message-id',
      receiptHandle: 'test-receipt-handle',
      body: JSON.stringify(messageBody),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1234567890',
        SenderId: 'test-sender',
        ApproximateFirstReceiveTimestamp: '1234567890'
      },
      messageAttributes: {},
      md5OfBody: 'test-md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
      awsRegion: 'us-east-1'
    }
  ]
});

describe('Appointment Completion Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete appointments', () => {
    it('should complete appointment successfully', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        status: 'processed'
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Verify the use case was called correctly
      const mockUseCase = require('@medical-appointment/infrastructure').UseCaseFactory.createCompleteAppointmentUseCase();
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      });
    });

    it('should skip message with non-processed status', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        status: 'pending' // Not processed yet
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Should not call the use case for non-processed appointments
      const mockUseCase = require('@medical-appointment/infrastructure').UseCaseFactory.createCompleteAppointmentUseCase();
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        // Missing required fields
        status: 'processed'
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Should not call the use case when validation fails
      const mockUseCase = require('@medical-appointment/infrastructure').UseCaseFactory.createCompleteAppointmentUseCase();
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle',
            body: 'invalid-json',
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Should not call the use case when JSON is invalid
      const mockUseCase = require('@medical-appointment/infrastructure').UseCaseFactory.createCompleteAppointmentUseCase();
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle EventBridge event format', async () => {
      const eventBridgeMessage = {
        'detail-type': 'Appointment Processed',
        detail: {
          appointmentId: 'test-id',
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
          status: 'processed'
        }
      };

      const event = createSQSEvent(eventBridgeMessage);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Verify the use case was called correctly
      const mockUseCase = require('@medical-appointment/infrastructure').UseCaseFactory.createCompleteAppointmentUseCase();
      expect(mockUseCase.execute).toHaveBeenCalledWith({
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE'
      });
    });
  });
});
