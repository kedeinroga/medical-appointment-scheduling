import { SNSAdapter } from '../sns.adapter';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Logger } from '@aws-lambda-powertools/logger';
import { CountryISO } from '../../../../../../libs/core/domain/src';
import { SNSError } from '../../../errors/aws.errors';
import { clearSingletonInstances } from '../../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../config/aws.config', () => ({
  AWS_CONFIG: {
    AWS_REGION: 'us-east-1',
    APPOINTMENTS_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789:test-topic',
    APPOINTMENTS_PE_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789:test-topic-pe',
    APPOINTMENTS_CL_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789:test-topic-cl'
  },
  getSNSTopicArnByCountry: jest.fn((countryISO: string) => {
    switch (countryISO) {
      case 'PE':
        return 'arn:aws:sns:us-east-1:123456789:test-topic-pe';
      case 'CL':
        return 'arn:aws:sns:us-east-1:123456789:test-topic-cl';
      default:
        throw new Error(`Unsupported country: ${countryISO}`);
    }
  })
}));

describe('SNSAdapter - Complete Coverage', () => {
  let adapter: SNSAdapter;
  let mockSNSClient: jest.Mocked<SNSClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearSingletonInstances(); // Clear singleton instances between tests
    
    mockSNSClient = {
      send: jest.fn()
    } as any;
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    (SNSClient as jest.Mock).mockImplementation(() => mockSNSClient);
    (Logger as any).mockImplementation(() => mockLogger);

    process.env.AWS_REGION = 'us-east-1';
    process.env.APPOINTMENTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789:test-topic';
    
    adapter = new SNSAdapter();
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.APPOINTMENTS_TOPIC_ARN;
  });

  describe('publishAppointmentCreated', () => {
    const appointmentData = {
      appointmentId: 'test-appointment-id',
      countryISO: 'PE',
      insuredId: 'test-insured-id',
      scheduleId: 123
    };

    it('should publish appointment created message successfully', async () => {
      const mockResult = { MessageId: 'test-message-id' };
      (mockSNSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishAppointmentCreated(appointmentData);

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment created message published successfully',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE',
          messageId: 'test-message-id'
        })
      );
    });

    it('should handle Error instance in publishAppointmentCreated', async () => {
      const error = new Error('SNS publish error');
      (mockSNSClient.send as jest.Mock).mockRejectedValue(error);

      await expect(adapter.publishAppointmentCreated(appointmentData)).rejects.toThrow(SNSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment created message',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE',
          error: 'SNS publish error'
        })
      );
    });

    it('should handle non-Error instance in publishAppointmentCreated', async () => {
      const unknownError = { message: 'Unknown error object' };
      (mockSNSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.publishAppointmentCreated(appointmentData)).rejects.toThrow(SNSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment created message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });

    it('should handle string error in publishAppointmentCreated', async () => {
      const stringError = 'String error message';
      (mockSNSClient.send as jest.Mock).mockRejectedValue(stringError);

      await expect(adapter.publishAppointmentCreated(appointmentData)).rejects.toThrow(SNSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment created message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });

    it('should handle null error in publishAppointmentCreated', async () => {
      (mockSNSClient.send as jest.Mock).mockRejectedValue(null);

      await expect(adapter.publishAppointmentCreated(appointmentData)).rejects.toThrow(TypeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment created message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('publishMessage', () => {
    const message = { id: '123', data: 'test' };

    it('should publish message successfully without attributes', async () => {
      const mockResult = { MessageId: 'test-generic-message-id' };
      (mockSNSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishMessage(message);

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message published successfully',
        expect.objectContaining({
          messageId: 'test-generic-message-id'
        })
      );
    });

    it('should publish message successfully with attributes', async () => {
      const mockResult = { MessageId: 'test-message-with-attrs' };
      (mockSNSClient.send as jest.Mock).mockResolvedValue(mockResult);
      const attributes = { eventType: 'test', priority: 'high' };

      await adapter.publishMessage(message, attributes);

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message published successfully',
        expect.objectContaining({
          messageId: 'test-message-with-attrs'
        })
      );
    });

    it('should publish message successfully with empty attributes', async () => {
      const mockResult = { MessageId: 'test-empty-attrs' };
      (mockSNSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishMessage(message, {});

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
    });

    it('should handle Error instance in publishMessage', async () => {
      const error = new Error('SNS error');
      (mockSNSClient.send as jest.Mock).mockRejectedValue(error);

      await expect(adapter.publishMessage(message)).rejects.toThrow(SNSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish message',
        expect.objectContaining({
          error: 'SNS error'
        })
      );
    });

    it('should handle non-Error instance in publishMessage', async () => {
      const unknownError = { code: 'UNKNOWN' };
      (mockSNSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.publishMessage(message)).rejects.toThrow(SNSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });

    it('should handle undefined error in publishMessage', async () => {
      (mockSNSClient.send as jest.Mock).mockRejectedValue(undefined);

      await expect(adapter.publishMessage(message)).rejects.toThrow(TypeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('publishToCountrySpecificTopic', () => {
    const message = { appointmentId: 'test-123' };
    const eventType = 'AppointmentProcessed';

    it('should publish to country specific topic for Peru', async () => {
      const mockResult = { MessageId: 'test-peru-message' };
      (mockSNSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishToCountrySpecificTopic(message, CountryISO.PERU, eventType);

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message published to country-specific topic successfully',
        expect.objectContaining({
          messageId: 'test-peru-message',
          countryISO: 'PE'
        })
      );
    });

    it('should publish to country specific topic for Chile', async () => {
      const mockResult = { MessageId: 'test-chile-message' };
      (mockSNSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishToCountrySpecificTopic(message, CountryISO.CHILE, eventType);

      expect(mockSNSClient.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message published to country-specific topic successfully',
        expect.objectContaining({
          messageId: 'test-chile-message',
          countryISO: 'CL'
        })
      );
    });

    it('should handle errors in publishToCountrySpecificTopic', async () => {
      const error = new Error('Country topic error');
      (mockSNSClient.send as jest.Mock).mockRejectedValue(error);

      await expect(
        adapter.publishToCountrySpecificTopic(message, CountryISO.PERU, eventType)
      ).rejects.toThrow(SNSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish message to country-specific topic',
        expect.objectContaining({
          error: 'Country topic error',
          countryISO: 'PE',
          eventType: 'AppointmentProcessed'
        })
      );
    });
  });

  describe('constructor edge cases', () => {
    it('should initialize with AWS configuration', () => {
      const newAdapter = new SNSAdapter();
      
      expect(SNSClient).toHaveBeenCalledWith({
        region: 'us-east-1'
      });
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'sns-adapter'
      });
    });
  });
});
