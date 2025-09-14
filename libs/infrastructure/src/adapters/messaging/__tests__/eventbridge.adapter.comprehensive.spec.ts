import { EventBridgeAdapter } from '../eventbridge.adapter';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Logger } from '@aws-lambda-powertools/logger';
import { EventBridgeError } from '../../../errors/aws.errors';
import { clearSingletonInstances } from '../../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-lambda-powertools/logger');

// Mock factories
const createMockDomainEvent = () => ({
  eventId: 'test-event-id',
  eventName: () => 'TestEvent',
  occurredOn: new Date('2024-01-01T00:00:00.000Z'),
  toPrimitives: () => ({ id: 'test-event-id', type: 'test' })
});

describe('EventBridgeAdapter - Comprehensive Coverage', () => {
  let adapter: EventBridgeAdapter;
  let mockEventBridgeClient: jest.Mocked<EventBridgeClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearSingletonInstances(); // Clear singleton instances between tests
    
    mockEventBridgeClient = {
      send: jest.fn()
    } as any;
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    (EventBridgeClient as jest.Mock).mockImplementation(() => mockEventBridgeClient);
    (Logger as any).mockImplementation(() => mockLogger);

    process.env.AWS_REGION = 'us-east-1';
    process.env.EVENTBRIDGE_BUS_NAME = 'test-event-bus';
    
    adapter = new EventBridgeAdapter();
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.EVENTBRIDGE_BUS_NAME;
  });

  describe('publish', () => {
    it('should publish domain event successfully', async () => {
      const mockEvent = createMockDomainEvent();
      const mockResult = { FailedEntryCount: 0 };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publish(mockEvent as any);

      expect(mockEventBridgeClient.send).toHaveBeenCalledWith(
        expect.any(PutEventsCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Domain event published successfully',
        expect.objectContaining({
          eventId: 'test-event-id',
          eventName: 'TestEvent'
        })
      );
    });

    it('should handle failed entries in publish', async () => {
      const mockEvent = createMockDomainEvent();
      const mockResult = { 
        FailedEntryCount: 1,
        Entries: [{ ErrorCode: 'InternalFailure' }]
      };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await expect(adapter.publish(mockEvent as any)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish domain event',
        expect.objectContaining({
          eventId: 'test-event-id',
          eventName: 'TestEvent'
        })
      );
    });

    it('should handle AWS SDK errors in publish', async () => {
      const mockEvent = createMockDomainEvent();
      const awsError = new Error('AWS SDK Error');
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.publish(mockEvent as any)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish domain event',
        expect.objectContaining({
          error: 'AWS SDK Error'
        })
      );
    });

    it('should handle unknown errors in publish', async () => {
      const mockEvent = createMockDomainEvent();
      const unknownError = { message: 'Unknown error' };
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.publish(mockEvent as any)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish domain event',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('publishAppointmentProcessed', () => {
    const appointmentData = {
      appointmentId: 'test-appointment-id',
      countryISO: 'PE',
      insuredId: 'test-insured-id',
      scheduleId: 123
    };

    it('should publish appointment processed event successfully', async () => {
      const mockResult = { FailedEntryCount: 0 };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishAppointmentProcessed(appointmentData);

      expect(mockEventBridgeClient.send).toHaveBeenCalledWith(
        expect.any(PutEventsCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment processed event published successfully',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE'
        })
      );
    });

    it('should handle failed entries in publishAppointmentProcessed', async () => {
      const mockResult = { 
        FailedEntryCount: 1,
        Entries: [{ ErrorCode: 'InternalFailure' }]
      };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await expect(adapter.publishAppointmentProcessed(appointmentData)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment processed event',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          countryISO: 'PE'
        })
      );
    });

    it('should handle AWS SDK errors in publishAppointmentProcessed', async () => {
      const awsError = new Error('AWS SDK Error');
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.publishAppointmentProcessed(appointmentData)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment processed event',
        expect.objectContaining({
          error: 'AWS SDK Error'
        })
      );
    });

    it('should handle unknown errors in publishAppointmentProcessed', async () => {
      const unknownError = new Error('Unknown error');
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.publishAppointmentProcessed(appointmentData)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish appointment processed event',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('publishCustomEvent', () => {
    const eventData = {
      source: 'test-service',
      detailType: 'Custom Event',
      detail: { id: '123', status: 'active' }
    };

    it('should publish custom event successfully with default bus', async () => {
      const mockResult = { FailedEntryCount: 0 };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishCustomEvent(
        eventData.source,
        eventData.detailType,
        eventData.detail
      );

      expect(mockEventBridgeClient.send).toHaveBeenCalledWith(
        expect.any(PutEventsCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Custom event published successfully',
        expect.objectContaining({
          detailType: 'Custom Event',
          source: 'test-service'
        })
      );
    });

    it('should publish custom event successfully with custom bus', async () => {
      const mockResult = { FailedEntryCount: 0 };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishCustomEvent(
        eventData.source,
        eventData.detailType,
        eventData.detail,
        'custom-event-bus'
      );

      expect(mockEventBridgeClient.send).toHaveBeenCalledWith(
        expect.any(PutEventsCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Custom event published successfully',
        expect.objectContaining({
          eventBusName: 'custom-event-bus'
        })
      );
    });

    it('should handle failed entries in publishCustomEvent', async () => {
      const mockResult = { 
        FailedEntryCount: 1,
        Entries: [{ ErrorCode: 'ValidationError' }]
      };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await expect(adapter.publishCustomEvent(
        eventData.source,
        eventData.detailType,
        eventData.detail
      )).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish custom event',
        expect.objectContaining({
          detailType: 'Custom Event',
          source: 'test-service'
        })
      );
    });

    it('should handle AWS SDK errors in publishCustomEvent', async () => {
      const awsError = new Error('Permission denied');
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.publishCustomEvent(
        eventData.source,
        eventData.detailType,
        eventData.detail
      )).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish custom event',
        expect.objectContaining({
          error: 'Permission denied'
        })
      );
    });

    it('should handle unknown errors in publishCustomEvent', async () => {
      const unknownError = 'String error';
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.publishCustomEvent(
        eventData.source,
        eventData.detailType,
        eventData.detail
      )).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish custom event',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('publishBatchEvents', () => {
    const batchEvents = [
      {
        detailType: 'Event 1',
        detail: { id: '1' },
        source: 'service-1'
      },
      {
        detailType: 'Event 2',
        detail: { id: '2' },
        source: 'service-2'
      }
    ];

    it('should publish batch events successfully', async () => {
      const mockResult = { FailedEntryCount: 0 };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await adapter.publishBatchEvents(batchEvents);

      expect(mockEventBridgeClient.send).toHaveBeenCalledWith(
        expect.any(PutEventsCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch events published successfully',
        expect.objectContaining({
          count: 2
        })
      );
    });

    it('should handle failed entries in publishBatchEvents', async () => {
      const mockResult = { 
        FailedEntryCount: 1,
        Entries: [
          { EventId: 'success' },
          { ErrorCode: 'InternalFailure' }
        ]
      };
      (mockEventBridgeClient.send as jest.Mock).mockResolvedValue(mockResult);

      await expect(adapter.publishBatchEvents(batchEvents)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish batch events',
        expect.objectContaining({
          count: 2
        })
      );
    });

    it('should handle AWS SDK errors in publishBatchEvents', async () => {
      const awsError = new Error('Throttling exception');
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(awsError);

      await expect(adapter.publishBatchEvents(batchEvents)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish batch events',
        expect.objectContaining({
          error: 'Throttling exception'
        })
      );
    });

    it('should handle unknown errors in publishBatchEvents', async () => {
      const unknownError = { someProperty: 'unknown' };
      (mockEventBridgeClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(adapter.publishBatchEvents(batchEvents)).rejects.toThrow(EventBridgeError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish batch events',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('constructor edge cases', () => {
    it('should initialize with configured region', () => {
      const newAdapter = new EventBridgeAdapter();
      
      expect(EventBridgeClient).toHaveBeenCalledWith({
        region: 'us-east-1'
      });
    });
  });
});
