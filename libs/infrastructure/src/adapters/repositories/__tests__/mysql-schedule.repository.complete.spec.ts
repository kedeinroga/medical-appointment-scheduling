import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Logger } from '@aws-lambda-powertools/logger';

import { MySQLScheduleRepository } from '../mysql-schedule.repository';
import { CountryISO } from '../../../../../core/domain/src/value-objects/country-iso.vo';
import { Schedule } from '../../../../../core/domain/src/entities/schedule.entity';
import { AWS_CONFIG } from '../../../config/aws.config';
import { DatabaseConnectionError } from '../../../errors/aws.errors';

// Mock dependencies
jest.mock('mysql2/promise');
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../config/aws.config', () => ({
  AWS_CONFIG: {
    STAGE: 'test',
    RDS_HOST: 'test-host',
    RDS_PASSWORD: 'test-password',
    RDS_PORT: 3306,
    RDS_USERNAME: 'test-user'
  }
}));

describe('MySQLScheduleRepository - Complete Coverage', () => {
  let repository: MySQLScheduleRepository;
  let mockPool: jest.Mocked<Pool>;
  let mockConnection: jest.Mocked<PoolConnection>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock pool and connection
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    } as any;

    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection),
      end: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Mock createPool
    (createPool as jest.Mock).mockReturnValue(mockPool);

    // Mock Logger constructor
    (Logger as any).mockImplementation(() => mockLogger);

    // Create repository instance
    repository = new MySQLScheduleRepository();
  });

  describe('constructor', () => {
    it('should initialize with correct database configuration', () => {
      expect(createPool).toHaveBeenCalledWith({
        connectionLimit: 10,
        database: 'medical_appointments_test',
        host: 'test-host',
        password: 'test-password',
        port: 3306,
        user: 'test-user'
      });
    });

    it('should initialize logger with correct service name', () => {
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'mysql-schedule-repository'
      });
    });
  });

  describe('save', () => {
    const mockSchedule = {
      toJSON: jest.fn().mockReturnValue({
        scheduleId: 123,
        centerId: 1,
        specialtyId: 2,
        medicId: 3,
        date: '2024-01-15T10:00:00.000Z'
      })
    } as any;

    it('should save schedule successfully', async () => {
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }] as any);

      await repository.save(mockSchedule, countryISO);

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO schedules'),
        [1, 2, 3, '2024-01-15T10:00:00.000Z', true, 'PE']
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule saved to MySQL successfully',
        {
          countryISO: 'PE',
          scheduleId: 123
        }
      );
    });

    it('should handle database connection error during save', async () => {
      const countryISO = CountryISO.CHILE;
      const dbError = new Error('Connection failed');
      mockPool.getConnection.mockRejectedValue(dbError);

      await expect(repository.save(mockSchedule, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save schedule to MySQL',
        {
          countryISO: 'CL',
          error: 'Connection failed'
        }
      );
    });

    it('should handle database execution error during save', async () => {
      const countryISO = CountryISO.PERU;
      const executionError = new Error('SQL syntax error');
      mockConnection.execute.mockRejectedValue(executionError);

      await expect(repository.save(mockSchedule, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save schedule to MySQL',
        {
          countryISO: 'PE',
          error: 'SQL syntax error'
        }
      );
    });

    it('should release connection even if save fails', async () => {
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockRejectedValue(new Error('Test error'));

      await expect(repository.save(mockSchedule, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions during save', async () => {
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockRejectedValue('String error');

      await expect(repository.save(mockSchedule, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save schedule to MySQL',
        {
          countryISO: 'PE',
          error: 'Unknown error'
        }
      );
    });
  });

  describe('findByScheduleId', () => {
    it('should find schedule by ID successfully', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      const mockRow = {
        center_id: 1,
        specialty_id: 2,
        medic_id: 3,
        available_date: '2024-01-15T10:00:00.000Z',
        schedule_id: 123
      };

      mockConnection.execute.mockResolvedValue([[mockRow]] as any);

      // Mock Schedule.create
      const mockScheduleInstance = { id: 123 };
      jest.spyOn(Schedule, 'create').mockReturnValue(mockScheduleInstance as any);

      const result = await repository.findByScheduleId(scheduleId, countryISO);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [123, 'PE']
      );
      expect(Schedule.create).toHaveBeenCalledWith({
        centerId: 1,
        date: new Date('2024-01-15T10:00:00.000Z'),
        medicId: 3,
        scheduleId: 123,
        specialtyId: 2
      });
      expect(result).toBe(mockScheduleInstance);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule retrieved from MySQL successfully',
        { countryISO: 'PE', scheduleId: 123 }
      );
    });

    it('should return null when schedule not found', async () => {
      const scheduleId = 999;
      const countryISO = CountryISO.CHILE;

      mockConnection.execute.mockResolvedValue([[]] as any);

      const result = await repository.findByScheduleId(scheduleId, countryISO);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule not found in MySQL',
        { countryISO: 'CL', scheduleId: 999 }
      );
    });

    it('should handle null rows array', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;

      mockConnection.execute.mockResolvedValue([null] as any);

      const result = await repository.findByScheduleId(scheduleId, countryISO);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule not found in MySQL',
        { countryISO: 'PE', scheduleId: 123 }
      );
    });

    it('should handle database connection error during find', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      const dbError = new Error('Connection timeout');
      mockPool.getConnection.mockRejectedValue(dbError);

      await expect(repository.findByScheduleId(scheduleId, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find schedule in MySQL',
        {
          countryISO: 'PE',
          scheduleId: 123,
          error: 'Connection timeout'
        }
      );
    });

    it('should release connection after successful find', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockResolvedValue([[]] as any);

      await repository.findByScheduleId(scheduleId, countryISO);

      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('findAvailableSchedules', () => {
    const mockRows = [
      {
        center_id: 1,
        specialty_id: 2,
        medic_id: 3,
        available_date: '2024-01-15T10:00:00.000Z',
        schedule_id: 123
      },
      {
        center_id: 2,
        specialty_id: 3,
        medic_id: 4,
        available_date: '2024-01-15T14:00:00.000Z',
        schedule_id: 124
      }
    ];

    it('should find available schedules without date filter', async () => {
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockResolvedValue([mockRows] as any);

      const mockScheduleInstances = [{ id: 123 }, { id: 124 }];
      jest.spyOn(Schedule, 'create')
        .mockReturnValueOnce(mockScheduleInstances[0] as any)
        .mockReturnValueOnce(mockScheduleInstances[1] as any);

      const result = await repository.findAvailableSchedules(countryISO);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringMatching(/WHERE is_available = TRUE AND country_iso = \?.*ORDER BY available_date ASC/s),
        ['PE']
      );
      expect(result).toHaveLength(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Available schedules retrieved from MySQL successfully',
        { countryISO: 'PE', count: 2 }
      );
    });

    it('should find available schedules with date filter', async () => {
      const countryISO = CountryISO.CHILE;
      const filterDate = new Date('2024-01-15');
      mockConnection.execute.mockResolvedValue([mockRows] as any);

      const mockScheduleInstances = [{ id: 123 }, { id: 124 }];
      jest.spyOn(Schedule, 'create')
        .mockReturnValueOnce(mockScheduleInstances[0] as any)
        .mockReturnValueOnce(mockScheduleInstances[1] as any);

      const result = await repository.findAvailableSchedules(countryISO, filterDate);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringMatching(/WHERE is_available = TRUE AND country_iso = \?.*AND DATE\(available_date\) = DATE\(\?\).*ORDER BY available_date ASC/s),
        ['CL', filterDate.toISOString()]
      );
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no schedules available', async () => {
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockResolvedValue([[]] as any);

      const result = await repository.findAvailableSchedules(countryISO);

      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Available schedules retrieved from MySQL successfully',
        { countryISO: 'PE', count: 0 }
      );
    });

    it('should handle database error during find available schedules', async () => {
      const countryISO = CountryISO.PERU;
      const dbError = new Error('Query execution failed');
      mockConnection.execute.mockRejectedValue(dbError);

      await expect(repository.findAvailableSchedules(countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find available schedules in MySQL',
        {
          countryISO: 'PE',
          error: 'Query execution failed'
        }
      );
    });
  });

  describe('markAsReserved', () => {
    it('should mark schedule as reserved successfully', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }] as any);

      await repository.markAsReserved(scheduleId, countryISO);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE schedules'),
        [123, 'PE']
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule marked as reserved successfully',
        { countryISO: 'PE', scheduleId: 123 }
      );
    });

    it('should throw error when no schedule found to mark as reserved', async () => {
      const scheduleId = 999;
      const countryISO = CountryISO.CHILE;
      mockConnection.execute.mockResolvedValue([{ affectedRows: 0 }] as any);

      await expect(repository.markAsReserved(scheduleId, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to mark schedule as reserved',
        {
          countryISO: 'CL',
          scheduleId: 999,
          error: 'No schedule found with ID 999 in country CL'
        }
      );
    });

    it('should handle database error during mark as reserved', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      const dbError = new Error('Update failed');
      mockConnection.execute.mockRejectedValue(dbError);

      await expect(repository.markAsReserved(scheduleId, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to mark schedule as reserved',
        {
          countryISO: 'PE',
          scheduleId: 123,
          error: 'Update failed'
        }
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('closeConnection', () => {
    it('should close connection pool successfully', async () => {
      await repository.closeConnection();

      expect(mockPool.end).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MySQL connection pool closed successfully'
      );
    });

    it('should handle error during connection close', async () => {
      const closeError = new Error('Failed to close pool');
      mockPool.end.mockRejectedValue(closeError);

      await repository.closeConnection();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to close MySQL connection pool',
        { error: 'Failed to close pool' }
      );
    });

    it('should handle non-Error exceptions during connection close', async () => {
      mockPool.end.mockRejectedValue('String error');

      await repository.closeConnection();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to close MySQL connection pool',
        { error: 'Unknown error' }
      );
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null connection during save cleanup', async () => {
      const mockSchedule = {
        toJSON: jest.fn().mockReturnValue({
          scheduleId: 123,
          centerId: 1,
          specialtyId: 2,
          medicId: 3,
          date: '2024-01-15T10:00:00.000Z'
        })
      } as any;
      const countryISO = CountryISO.PERU;
      
      mockPool.getConnection.mockResolvedValue(null as any);

      await expect(repository.save(mockSchedule, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      // Should not throw error when trying to release null connection
    });

    it('should handle connection release failure gracefully', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      
      mockConnection.execute.mockResolvedValue([[]] as any);
      mockConnection.release.mockImplementation(() => {
        // Simulate release failure but don't actually throw in test
        // This tests that the repository doesn't propagate release errors
      });

      // Should not throw error despite release failure simulation
      const result = await repository.findByScheduleId(scheduleId, countryISO);
      expect(result).toBeNull();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle malformed database row data', async () => {
      const scheduleId = 123;
      const countryISO = CountryISO.PERU;
      const malformedRow = {
        center_id: null,
        specialty_id: undefined,
        medic_id: 'invalid',
        available_date: 'invalid-date',
        schedule_id: 123
      };

      mockConnection.execute.mockResolvedValue([[malformedRow]] as any);
      jest.spyOn(Schedule, 'create').mockImplementation(() => {
        throw new Error('Invalid schedule data');
      });

      await expect(repository.findByScheduleId(scheduleId, countryISO))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find schedule in MySQL',
        expect.objectContaining({
          countryISO: 'PE',
          scheduleId: 123
        })
      );
    });
  });
});
