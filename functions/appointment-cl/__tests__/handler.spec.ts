import { SQSEvent, Context } from 'aws-lambda';

// Mock AWS Lambda Powertools Logger
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the country processing factory
jest.mock('@medical-appointment/infrastructure', () => ({
  CountryProcessingFactory: {
    createProcessAppointmentUseCase: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        appointmentId: 'test-id',
        status: 'processed',
        message: 'Appointment processed for CL'
      })
    })
  }
}));

// Import after mocking
import { main } from '../handler';

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'appointment-cl',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:appointment-cl',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/appointment-cl',
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
      body: JSON.stringify({
        Message: JSON.stringify(messageBody)
      }),
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

describe('Appointment CL Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Process CL appointments', () => {
    it('should process CL appointment successfully', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'CL'
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Verify that the factory method was called (indicating the handler processed the message)
      const { CountryProcessingFactory } = require('@medical-appointment/infrastructure');
      expect(CountryProcessingFactory.createProcessAppointmentUseCase).toHaveBeenCalled();
    });

    it('should skip message for wrong country', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE' // Wrong country for CL handler
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Should not call the use case factory for wrong country
      const { CountryProcessingFactory } = require('@medical-appointment/infrastructure');
      expect(CountryProcessingFactory.createProcessAppointmentUseCase).not.toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        // Missing required fields
        countryISO: 'CL'
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // Should not call the use case when validation fails
      const { CountryProcessingFactory } = require('@medical-appointment/infrastructure');
      expect(CountryProcessingFactory.createProcessAppointmentUseCase).not.toHaveBeenCalled();
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
      const mockUseCase = require('@medical-appointment/infrastructure').CountryProcessingFactory.createProcessAppointmentUseCase();
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
