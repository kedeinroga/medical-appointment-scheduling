import { SQSAdapter } from '../sqs.adapter';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@aws-lambda-powertools/logger';
import { SQSError } from '../../../errors/aws.errors';
import { clearSingletonInstances } from '../../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

jest.mock('@aws-sdk/client-sqs');
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../config/aws.config', () => ({
  AWS_CONFIG: {
    AWS_REGION: 'us-east-1',
    APPOINTMENTS_COMPLETION_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/123456789/completion-queue'
  },
  getSQSUrlByCountry: jest.fn((country: string) => {
    const urls: Record<string, string> = {
      'PE': 'https://sqs.us-east-1.amazonaws.com/123456789/pe-queue',
      'CL': 'https://sqs.us-east-1.amazonaws.com/123456789/cl-queue'
    };
    return urls[country] || 'https://sqs.us-east-1.amazonaws.com/123456789/default-queue';
  })
}));

describe('SQSAdapter - Comprehensive Coverage', () => {
  let adapter: SQSAdapter;
  let mockSQSClient: jest.Mocked<SQSClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearSingletonInstances(); // Clear singleton instances between tests
    
    mockSQSClient = {
      send: jest.fn()
    } as any;
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    (SQSClient as jest.Mock).mockImplementation(() => mockSQSClient);
    (Logger as any).mockImplementation(() => mockLogger);

    process.env.AWS_REGION = 'us-east-1';
    
    adapter = new SQSAdapter();
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
  });

  describe('sendMessageToCountryQueue', () => {
    const appointmentData = {
      appointmentId: 'test-appointment-id',
      countryISO: 'PE',
      insuredId: 'test-insured-id',
      scheduleId: 123
    };

    it('should send message to country queue successfully', async () => {
      const mockResult = { MessageId: 'test-message-id' };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.sendMessageToCountryQueue(appointmentData);

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message sent to country queue successfully',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE',
          messageId: 'test-message-id'
        })
      );
    });

    it('should handle AWS SDK errors in sendMessageToCountryQueue', async () => {
      const awsError = new Error('SQS send error');
      (mockSQSClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.sendMessageToCountryQueue(appointmentData)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message to country queue',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE',
          error: 'SQS send error'
        })
      );
    });

    it('should handle unknown errors in sendMessageToCountryQueue', async () => {
      const unknownError = { message: 'Unknown error' };
      (mockSQSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.sendMessageToCountryQueue(appointmentData)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message to country queue',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });

    it('should handle different country codes', async () => {
      const clAppointmentData = { ...appointmentData, countryISO: 'CL' };
      const mockResult = { MessageId: 'test-message-id-cl' };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.sendMessageToCountryQueue(clAppointmentData);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message sent to country queue successfully',
        expect.objectContaining({
          countryISO: 'CL'
        })
      );
    });
  });

  describe('sendMessageToCompletionQueue', () => {
    const appointmentData = {
      appointmentId: 'test-appointment-id',
      countryISO: 'PE',
      status: 'COMPLETED'
    };

    it('should send message to completion queue successfully', async () => {
      const mockResult = { MessageId: 'test-completion-message-id' };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.sendMessageToCompletionQueue(appointmentData);

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message sent to completion queue successfully',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE',
          messageId: 'test-completion-message-id'
        })
      );
    });

    it('should handle AWS SDK errors in sendMessageToCompletionQueue', async () => {
      const awsError = new Error('Queue not found');
      (mockSQSClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.sendMessageToCompletionQueue(appointmentData)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message to completion queue',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          error: 'Queue not found'
        })
      );
    });

    it('should handle unknown errors in sendMessageToCompletionQueue', async () => {
      const unknownError = new Error('Unknown error');
      (mockSQSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.sendMessageToCompletionQueue(appointmentData)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message to completion queue',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('sendMessage', () => {
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue';
    const messageBody = { id: '123', data: 'test' };

    it('should send message successfully without attributes', async () => {
      const mockResult = { MessageId: 'test-generic-message-id' };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      const result = await adapter.sendMessage(queueUrl, messageBody);

      expect(result).toBe('test-generic-message-id');
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message sent successfully',
        expect.objectContaining({
          messageId: 'test-generic-message-id',
          queueUrl
        })
      );
    });

    it('should send message successfully with attributes', async () => {
      const mockResult = { MessageId: 'test-message-with-attrs' };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);
      const attributes = { eventType: 'test', priority: 'high' };

      const result = await adapter.sendMessage(queueUrl, messageBody, attributes);

      expect(result).toBe('test-message-with-attrs');
      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );
    });

    it('should handle missing MessageId in response', async () => {
      const mockResult = {}; // No MessageId
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      const result = await adapter.sendMessage(queueUrl, messageBody);

      expect(result).toBe('');
    });

    it('should handle AWS SDK errors in sendMessage', async () => {
      const awsError = new Error('Access denied');
      (mockSQSClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.sendMessage(queueUrl, messageBody)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message',
        expect.objectContaining({
          error: 'Access denied',
          queueUrl
        })
      );
    });

    it('should handle unknown errors in sendMessage', async () => {
      const unknownError = 'String error';
      (mockSQSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.sendMessage(queueUrl, messageBody)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('receiveMessages', () => {
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789/receive-queue';

    it('should receive messages successfully', async () => {
      const mockMessages = [
        {
          MessageId: 'msg-1',
          Body: JSON.stringify({ id: '1', data: 'test1' }),
          ReceiptHandle: 'receipt-1'
        },
        {
          MessageId: 'msg-2',
          Body: JSON.stringify({ id: '2', data: 'test2' }),
          ReceiptHandle: 'receipt-2'
        }
      ];
      const mockResult = { Messages: mockMessages };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      const result = await adapter.receiveMessages(queueUrl, 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        body: { id: '1', data: 'test1' },
        messageId: 'msg-1',
        receiptHandle: 'receipt-1'
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Messages received successfully',
        expect.objectContaining({
          count: 2,
          queueUrl
        })
      );
    });

    it('should handle empty messages response', async () => {
      const mockResult = { Messages: [] };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      const result = await adapter.receiveMessages(queueUrl);

      expect(result).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Messages received successfully',
        expect.objectContaining({
          count: 0
        })
      );
    });

    it('should handle undefined Messages in response', async () => {
      const mockResult = {}; // No Messages property
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      const result = await adapter.receiveMessages(queueUrl);

      expect(result).toHaveLength(0);
    });

    it('should handle messages with null body', async () => {
      const mockMessages = [
        {
          MessageId: 'msg-null',
          Body: null,
          ReceiptHandle: 'receipt-null'
        }
      ];
      const mockResult = { Messages: mockMessages };
      (mockSQSClient.send as jest.Mock).mockResolvedValue(mockResult);

      const result = await adapter.receiveMessages(queueUrl);

      expect(result[0].body).toBeNull();
    });

    it('should handle AWS SDK errors in receiveMessages', async () => {
      const awsError = new Error('Queue does not exist');
      (mockSQSClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.receiveMessages(queueUrl)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to receive messages',
        expect.objectContaining({
          error: 'Queue does not exist',
          queueUrl
        })
      );
    });

    it('should handle unknown errors in receiveMessages', async () => {
      const unknownError = { someProperty: 'unknown' };
      (mockSQSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.receiveMessages(queueUrl)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to receive messages',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('deleteMessage', () => {
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789/delete-queue';
    const receiptHandle = 'test-receipt-handle';

    it('should delete message successfully', async () => {
      (mockSQSClient.send as jest.Mock).mockResolvedValue({});

      await adapter.deleteMessage(queueUrl, receiptHandle);

      expect(mockSQSClient.send).toHaveBeenCalledWith(
        expect.any(DeleteMessageCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Message deleted successfully',
        expect.objectContaining({
          queueUrl,
          receiptHandle
        })
      );
    });

    it('should handle AWS SDK errors in deleteMessage', async () => {
      const awsError = new Error('Receipt handle invalid');
      (mockSQSClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.deleteMessage(queueUrl, receiptHandle)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete message',
        expect.objectContaining({
          error: 'Receipt handle invalid',
          queueUrl,
          receiptHandle
        })
      );
    });

    it('should handle unknown errors in deleteMessage', async () => {
      const unknownError = 42;
      (mockSQSClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.deleteMessage(queueUrl, receiptHandle)).rejects.toThrow(SQSError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete message',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('constructor edge cases', () => {
    it('should initialize with configured region', () => {
      const newAdapter = new SQSAdapter();
      
      expect(SQSClient).toHaveBeenCalledWith({
        region: 'us-east-1'
      });
    });
  });
});
