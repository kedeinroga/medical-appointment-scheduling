import { SQSEvent, Context } from 'aws-lambda';

// Mock AWS Lambda Powertools Logger
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the infrastructure bridge factory
const mockProcessAppointmentUseCase = {
  execute: jest.fn().mockResolvedValue({
    appointmentId: 'test-id',
    status: 'processed'
  })
};

jest.mock('@medical-appointment/infrastructure', () => ({
  InfrastructureBridgeFactory: {
    createProcessCountryAppointmentUseCase: jest.fn().mockReturnValue(mockProcessAppointmentUseCase)
  }
}));

// Mock shared utilities
jest.mock('@medical-appointment/shared', () => ({
  logBusinessError: jest.fn(),
  logInfrastructureError: jest.fn(),
  maskInsuredId: jest.fn((id) => `${id.substring(0, 2)}***`)
}));

// Mock domain
jest.mock('@medical-appointment/core-domain', () => ({
  CountryISO: {
    fromString: jest.fn().mockReturnValue({ value: 'CL' })
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

      // Verify that the use case was called (indicating the handler processed the message)
      expect(mockProcessAppointmentUseCase.execute).toHaveBeenCalledWith({
        appointmentId: 'test-id',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'CL'
      });
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

      // Should not call the use case for wrong country
      expect(mockProcessAppointmentUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', async () => {
      const messageBody = {
        appointmentId: 'test-id',
        // Missing required fields
        countryISO: 'CL'
      };

      const event = createSQSEvent(messageBody);

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // The handler should complete without throwing
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
            eventSourceARN: 'arn:aws:sqs:region:account:queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(main(event, mockContext, () => {})).resolves.toBeUndefined();

      // The handler should complete without throwing even with invalid JSON
    });
  });
});
