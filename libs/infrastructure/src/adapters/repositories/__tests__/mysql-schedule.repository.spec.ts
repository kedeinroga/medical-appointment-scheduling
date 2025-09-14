import { MySQLScheduleRepository } from '../mysql-schedule.repository';
import { CountryISO } from '../../../../../core/domain/src/value-objects/country-iso.vo';
import { Schedule } from '../../../../../core/domain/src/entities/schedule.entity';
import { createPool } from 'mysql2/promise';
import { Logger } from '@aws-lambda-powertools/logger';
import { DatabaseConnectionError } from '../../../errors/aws.errors';
import { clearSingletonInstances } from '../../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

// Mock dependencies
jest.mock('mysql2/promise');
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../config/aws.config', () => ({
  AWS_CONFIG: {
    STAGE: 'test',
    RDS_HOST: 'test-host',
    RDS_USERNAME: 'test-user',
    RDS_PASSWORD: 'test-password',
    RDS_PORT: 3306
  }
}));

describe(MySQLScheduleRepository.name, () => {
  let repository: MySQLScheduleRepository;
  let mockPool: any;
  let mockConnection: any;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    clearSingletonInstances(); // Clear singleton instances between tests
    
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    };

    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    };

    (createPool as jest.Mock).mockReturnValue(mockPool);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    } as any;

    (Logger as any).mockImplementation(() => mockLogger);

    repository = new MySQLScheduleRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with proper configuration', () => {
      expect(createPool).toHaveBeenCalledWith({
        connectionLimit: 10,
        database: 'medical_appointments_test',
        host: 'test-host',
        password: 'test-password',
        port: 3306,
        user: 'test-user'
      });
    });

    it('should initialize logger with proper service name', () => {
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'mysql-schedule-repository'
      });
    });
  });

  describe('save', () => {
    it('should save schedule successfully', async () => {
      const schedule = Schedule.create({
        scheduleId: 1,
        centerId: 100,
        specialtyId: 200,
        medicId: 300,
        date: new Date('2025-09-15T10:00:00Z')
      });

      mockConnection.execute.mockResolvedValue([]);

      await repository.save(schedule, CountryISO.PERU);

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO schedules'),
        [100, 200, 300, '2025-09-15T10:00:00.000Z', true, 'PE']
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule saved to MySQL successfully',
        {
          countryISO: 'PE',
          scheduleId: 1
        }
      );
    });

    it('should handle database connection error during save', async () => {
      const schedule = Schedule.create({
        scheduleId: 1,
        centerId: 100,
        specialtyId: 200,
        medicId: 300,
        date: new Date('2025-09-15T10:00:00Z')
      });

      const dbError = new Error('Connection failed');
      mockConnection.execute.mockRejectedValue(dbError);

      await expect(repository.save(schedule, CountryISO.PERU))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save schedule to MySQL',
        {
          countryISO: 'PE',
          error: 'Connection failed'
        }
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should release connection even when save fails', async () => {
      const schedule = Schedule.create({
        scheduleId: 1,
        centerId: 100,
        specialtyId: 200,
        medicId: 300,
        date: new Date('2025-09-15T10:00:00Z')
      });

      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(schedule, CountryISO.PERU))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle case when connection is null', async () => {
      const schedule = Schedule.create({
        scheduleId: 1,
        centerId: 100,
        specialtyId: 200,
        medicId: 300,
        date: new Date('2025-09-15T10:00:00Z')
      });

      mockPool.getConnection.mockResolvedValue(null);

      await expect(repository.save(schedule, CountryISO.PERU))
        .rejects.toThrow();
    });
  });

  describe('findByScheduleId', () => {
    it('should find schedule successfully', async () => {
      const mockRow = {
        center_id: 100,
        specialty_id: 200,
        medic_id: 300,
        available_date: '2025-09-15T10:00:00Z',
        schedule_id: 1
      };

      mockConnection.execute.mockResolvedValue([[mockRow]]);

      const result = await repository.findByScheduleId(1, CountryISO.PERU);

      expect(result).toBeDefined();
      expect(result!.scheduleId).toBe(1);
      expect(result!.centerId).toBe(100);
      expect(result!.specialtyId).toBe(200);
      expect(result!.medicId).toBe(300);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1, 'PE']
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule retrieved from MySQL successfully',
        {
          countryISO: 'PE',
          scheduleId: 1
        }
      );
    });

    it('should return null when schedule not found', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await repository.findByScheduleId(1, CountryISO.PERU);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Schedule not found in MySQL',
        {
          countryISO: 'PE',
          scheduleId: 1
        }
      );
    });

    it('should handle database connection error during find', async () => {
      const dbError = new Error('Connection failed');
      mockConnection.execute.mockRejectedValue(dbError);

      await expect(repository.findByScheduleId(1, CountryISO.PERU))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find schedule in MySQL',
        {
          countryISO: 'PE',
          scheduleId: 1,
          error: 'Connection failed'
        }
      );
    });

    it('should release connection even when find fails', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      await expect(repository.findByScheduleId(1, CountryISO.PERU))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('findAvailableSchedules', () => {
    it('should find available schedules without date filter', async () => {
      const mockRows = [
        {
          center_id: 100,
          specialty_id: 200,
          medic_id: 300,
          available_date: '2025-09-15T10:00:00Z',
          schedule_id: 1
        },
        {
          center_id: 101,
          specialty_id: 201,
          medic_id: 301,
          available_date: '2025-09-16T10:00:00Z',
          schedule_id: 2
        }
      ];

      mockConnection.execute.mockResolvedValue([mockRows]);

      const result = await repository.findAvailableSchedules(CountryISO.PERU);

      expect(result).toHaveLength(2);
      expect(result[0].scheduleId).toBe(1);
      expect(result[1].scheduleId).toBe(2);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_available = TRUE AND country_iso = ?'),
        ['PE']
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Available schedules retrieved from MySQL successfully',
        {
          countryISO: 'PE',
          count: 2
        }
      );
    });

    it('should find available schedules with date filter', async () => {
      const filterDate = new Date('2025-09-15T00:00:00Z');
      const mockRows = [
        {
          center_id: 100,
          specialty_id: 200,
          medic_id: 300,
          available_date: '2025-09-15T10:00:00Z',
          schedule_id: 1
        }
      ];

      mockConnection.execute.mockResolvedValue([mockRows]);

      const result = await repository.findAvailableSchedules(CountryISO.PERU, filterDate);

      expect(result).toHaveLength(1);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('AND DATE(available_date) = DATE(?)'),
        ['PE', filterDate.toISOString()]
      );
    });

    it('should return empty array when no schedules found', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await repository.findAvailableSchedules(CountryISO.PERU);

      expect(result).toHaveLength(0);
    });

    it('should handle database connection error during findAvailableSchedules', async () => {
      const dbError = new Error('Connection failed');
      mockConnection.execute.mockRejectedValue(dbError);

      await expect(repository.findAvailableSchedules(CountryISO.PERU))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find available schedules in MySQL',
        {
          countryISO: 'PE',
          error: 'Connection failed'
        }
      );
    });

    it('should release connection even when findAvailableSchedules fails', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      await expect(repository.findAvailableSchedules(CountryISO.PERU))
        .rejects.toThrow(DatabaseConnectionError);

      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const schedule = Schedule.create({
        scheduleId: 1,
        centerId: 100,
        specialtyId: 200,
        medicId: 300,
        date: new Date('2025-09-15T10:00:00Z')
      });

      mockConnection.execute.mockRejectedValue('Unknown error type');

      await expect(repository.save(schedule, CountryISO.PERU))
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
});
