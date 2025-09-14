import { DynamoDBAppointmentRepository } from '../dynamodb-appointment.repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { 
  Appointment,
  AppointmentId,
  AppointmentStatus,
  InsuredId
} from '../../../../../../libs/core/domain/src';
import { clearSingletonInstances } from '../../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-lambda-powertools/logger');

// Mock factories for domain objects
const createMockAppointment = () => ({
  getAppointmentId: () => ({ getValue: () => 'test-appointment-id' }),
  toLogSafeJSON: () => ({ appointmentId: 'test-appointment-id', insuredId: 'test-***' }),
  toJSON: () => ({
    appointmentId: 'test-appointment-id',
    countryISO: 'PE',
    createdAt: '2024-01-01T00:00:00.000Z',
    insuredId: 'test-insured-id',
    processedAt: null,
    schedule: {
      scheduleId: 123,
      centerId: 1,
      date: '2024-01-01T10:00:00.000Z',
      medicId: 1,
      specialtyId: 1
    },
    status: 'PENDING',
    updatedAt: '2024-01-01T00:00:00.000Z'
  })
});

const createMockAppointmentId = (value: string = 'test-appointment-id') => ({
  getValue: () => value
});

const createMockInsuredId = (value: string = 'test-insured-id') => ({
  getValue: () => value,
  getMaskedValue: () => 'test-***'
});

describe('DynamoDBAppointmentRepository - Comprehensive Coverage', () => {
  let repository: DynamoDBAppointmentRepository;
  let mockDynamoClient: jest.Mocked<DynamoDBDocumentClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearSingletonInstances(); // Clear singleton instances between tests
    
    mockDynamoClient = {
      send: jest.fn()
    } as any;
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    (DynamoDBClient as jest.Mock).mockImplementation(() => ({}));
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDynamoClient);
    (Logger as any).mockImplementation(() => mockLogger);

    // Mock Appointment.fromPrimitives static method
    (Appointment as any).fromPrimitives = jest.fn().mockReturnValue(createMockAppointment());

    process.env.APPOINTMENTS_TABLE_NAME = 'test-appointments-table';
    process.env.AWS_REGION = 'us-east-1';
    
    repository = new DynamoDBAppointmentRepository();
  });

  afterEach(() => {
    delete process.env.APPOINTMENTS_TABLE_NAME;
    delete process.env.AWS_REGION;
  });

  describe('save', () => {
    it('should save appointment successfully', async () => {
      const mockAppointment = createMockAppointment();
      (mockDynamoClient.send as jest.Mock).mockResolvedValue({});

      await repository.save(mockAppointment as any);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(PutCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment saved successfully',
        expect.objectContaining({
          appointmentId: 'test-appointment-id'
        })
      );
    });

    it('should handle errors during save', async () => {
      const mockAppointment = createMockAppointment();
      const error = new Error('DynamoDB save error');
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(mockAppointment as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save appointment',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          error: 'DynamoDB save error'
        })
      );
    });

    it('should handle unknown errors during save', async () => {
      const mockAppointment = createMockAppointment();
      const unknownError = 'Unknown error';
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(repository.save(mockAppointment as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save appointment',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('findByAppointmentId', () => {
    it('should find appointment successfully', async () => {
      const appointmentId = createMockAppointmentId();
      const mockItem = {
        appointmentId: 'test-appointment-id',
        countryISO: 'PE',
        createdAt: '2024-01-01T00:00:00.000Z',
        insuredId: 'test-insured-id',
        scheduleId: 123,
        status: 'PENDING',
        updatedAt: '2024-01-01T00:00:00.000Z',
        schedule: {
          scheduleId: 123,
          centerId: 1,
          date: '2024-01-01T10:00:00.000Z',
          medicId: 1,
          specialtyId: 1
        }
      };

      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Item: mockItem
      });

      const result = await repository.findByAppointmentId(appointmentId as any);

      expect(result).toBeDefined();
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(GetCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment retrieved successfully',
        expect.any(Object)
      );
    });

    it('should return null when appointment not found', async () => {
      const appointmentId = createMockAppointmentId();
      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Item: undefined
      });

      const result = await repository.findByAppointmentId(appointmentId as any);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment not found',
        expect.objectContaining({
          appointmentId: 'test-appointment-id'
        })
      );
    });

    it('should handle errors during findByAppointmentId', async () => {
      const appointmentId = createMockAppointmentId();
      const error = new Error('DynamoDB get error');
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(repository.findByAppointmentId(appointmentId as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find appointment by ID',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          error: 'DynamoDB get error'
        })
      );
    });

    it('should handle unknown errors during findByAppointmentId', async () => {
      const appointmentId = createMockAppointmentId();
      const unknownError = { someProperty: 'value' };
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(repository.findByAppointmentId(appointmentId as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find appointment by ID',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('findByInsuredId', () => {
    it('should find appointments by insured ID successfully', async () => {
      const insuredId = createMockInsuredId();
      const mockItems = [
        {
          appointmentId: 'test-appointment-1',
          insuredId: 'test-insured-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          scheduleId: 123,
          schedule: { scheduleId: 123, centerId: 1 }
        },
        {
          appointmentId: 'test-appointment-2',
          insuredId: 'test-insured-id',
          createdAt: '2024-01-02T00:00:00.000Z',
          scheduleId: 124,
          schedule: { scheduleId: 124, centerId: 1 }
        }
      ];

      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Items: mockItems
      });

      const result = await repository.findByInsuredId(insuredId as any);

      expect(result).toHaveLength(2);
      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(QueryCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointments retrieved by insured ID',
        expect.objectContaining({
          insuredId: 'test-***',
          count: 2
        })
      );
    });

    it('should return empty array when no appointments found', async () => {
      const insuredId = createMockInsuredId();
      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Items: []
      });

      const result = await repository.findByInsuredId(insuredId as any);

      expect(result).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointments retrieved by insured ID',
        expect.objectContaining({
          count: 0
        })
      );
    });

    it('should handle null/undefined Items in response', async () => {
      const insuredId = createMockInsuredId();
      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Items: null
      });

      const result = await repository.findByInsuredId(insuredId as any);

      expect(result).toHaveLength(0);
    });

    it('should handle errors during findByInsuredId', async () => {
      const insuredId = createMockInsuredId();
      const error = new Error('DynamoDB query error');
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(repository.findByInsuredId(insuredId as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find appointments by insured ID',
        expect.objectContaining({
          insuredId: 'test-***',
          error: 'DynamoDB query error'
        })
      );
    });

    it('should handle unknown errors during findByInsuredId', async () => {
      const insuredId = createMockInsuredId();
      const unknownError = null;
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(repository.findByInsuredId(insuredId as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find appointments by insured ID',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('update', () => {
    it('should update appointment successfully', async () => {
      const mockAppointment = createMockAppointment();
      (mockDynamoClient.send as jest.Mock).mockResolvedValue({});

      await repository.update(mockAppointment as any);

      expect(mockDynamoClient.send).toHaveBeenCalledWith(
        expect.any(UpdateCommand)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment updated successfully',
        expect.objectContaining({
          appointmentId: 'test-appointment-id'
        })
      );
    });

    it('should handle ConditionalCheckFailedException (appointment not found)', async () => {
      const mockAppointment = createMockAppointment();
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(repository.update(mockAppointment as any)).rejects.toThrow('Appointment with ID test-appointment-id not found');
    });

    it('should handle other errors during update', async () => {
      const mockAppointment = createMockAppointment();
      const error = new Error('DynamoDB update error');
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(error);

      await expect(repository.update(mockAppointment as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update appointment',
        expect.objectContaining({
          appointmentId: 'test-appointment-id',
          error: 'DynamoDB update error'
        })
      );
    });

    it('should handle unknown errors during update', async () => {
      const mockAppointment = createMockAppointment();
      const unknownError = 'Unknown error';
      (mockDynamoClient.send as jest.Mock).mockRejectedValue(unknownError);

      await expect(repository.update(mockAppointment as any)).rejects.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update appointment',
        expect.objectContaining({
          error: 'Unknown error'
        })
      );
    });
  });

  describe('mapFromStorageFormat edge cases', () => {
    it('should handle missing schedule data in storage format', async () => {
      const appointmentId = createMockAppointmentId();
      const mockItem = {
        appointmentId: 'test-appointment-id',
        countryISO: 'PE',
        createdAt: '2024-01-01T00:00:00.000Z',
        insuredId: 'test-insured-id',
        scheduleId: 123,
        status: 'PENDING',
        updatedAt: '2024-01-01T00:00:00.000Z'
        // Missing schedule object
      };

      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Item: mockItem
      });

      await repository.findByAppointmentId(appointmentId as any);

      expect(Appointment.fromPrimitives).toHaveBeenCalledWith(
        expect.objectContaining({
          schedule: expect.objectContaining({
            centerId: 0,
            medicId: 0,
            specialtyId: 0
          })
        })
      );
    });

    it('should handle missing processedAt date', async () => {
      const appointmentId = createMockAppointmentId();
      const mockItem = {
        appointmentId: 'test-appointment-id',
        countryISO: 'PE',
        createdAt: '2024-01-01T00:00:00.000Z',
        insuredId: 'test-insured-id',
        scheduleId: 123,
        status: 'PENDING',
        updatedAt: '2024-01-01T00:00:00.000Z',
        processedAt: null,
        schedule: {
          scheduleId: 123,
          centerId: 1,
          date: '2024-01-01T10:00:00.000Z',
          medicId: 1,
          specialtyId: 1
        }
      };

      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Item: mockItem
      });

      await repository.findByAppointmentId(appointmentId as any);

      expect(Appointment.fromPrimitives).toHaveBeenCalledWith(
        expect.objectContaining({
          processedAt: null
        })
      );
    });

    it('should handle existing processedAt date', async () => {
      const appointmentId = createMockAppointmentId();
      const processedDate = '2024-01-01T12:00:00.000Z';
      const mockItem = {
        appointmentId: 'test-appointment-id',
        countryISO: 'PE',
        createdAt: '2024-01-01T00:00:00.000Z',
        insuredId: 'test-insured-id',
        scheduleId: 123,
        status: 'PROCESSED',
        updatedAt: '2024-01-01T00:00:00.000Z',
        processedAt: processedDate,
        schedule: {
          scheduleId: 123,
          centerId: 1,
          date: '2024-01-01T10:00:00.000Z',
          medicId: 1,
          specialtyId: 1
        }
      };

      (mockDynamoClient.send as jest.Mock).mockResolvedValue({
        Item: mockItem
      });

      await repository.findByAppointmentId(appointmentId as any);

      expect(Appointment.fromPrimitives).toHaveBeenCalledWith(
        expect.objectContaining({
          processedAt: new Date(processedDate)
        })
      );
    });
  });
});
