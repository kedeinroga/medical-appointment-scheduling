import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Logger } from '@aws-lambda-powertools/logger';

import { MySQLAppointmentRepository } from '../mysql-appointment.repository';
import { DatabaseConnectionError } from '../../../errors/aws.errors';
import { clearSingletonInstances } from '../../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

// Mock dependencies
jest.mock('mysql2/promise');
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../config/aws.config', () => ({
  AWS_CONFIG: {
    STAGE: 'test',
    RDS_HOST: 'localhost',
    RDS_PORT: 3306,
    RDS_USERNAME: 'test',
    RDS_PASSWORD: 'test'
  }
}));

// Mock core domain imports
jest.mock('@medical-appointment/core-domain', () => ({
  Appointment: {
    fromPrimitives: jest.fn()
  }
}));

describe('MySQLAppointmentRepository', () => {
  let repository: MySQLAppointmentRepository;
  let mockPool: jest.Mocked<Pool>;
  let mockConnection: jest.Mocked<PoolConnection>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearSingletonInstances(); // Clear singleton instances between tests

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    // Mock Connection
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    } as any;

    // Mock Pool
    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection),
      end: jest.fn().mockResolvedValue(undefined)
    } as any;

    (createPool as jest.MockedFunction<typeof createPool>).mockReturnValue(mockPool);

    repository = new MySQLAppointmentRepository();
  });

  describe('constructor', () => {
    it('should initialize with logger and database pool', () => {
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'mysql-appointment-repository'
      });

      expect(createPool).toHaveBeenCalledWith({
        connectionLimit: 10,
        database: 'medical_appointments_test',
        host: 'localhost',
        password: 'test',
        port: 3306,
        user: 'test'
      });
    });
  });

  describe('save', () => {
    const mockAppointment = {
      getAppointmentId: () => ({ getValue: () => 'apt-123' }),
      getCountryISO: () => ({ getValue: () => 'PE' }),
      toJSON: () => ({
        appointmentId: 'apt-123',
        insuredId: '12345',
        schedule: {
          scheduleId: 1,
          centerId: 101,
          specialtyId: 201,
          medicId: 301,
          date: new Date('2024-01-15T10:00:00Z')
        },
        status: 'scheduled'
      })
    } as any;

    it('should save appointment successfully', async () => {
      const executeResult = {
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        insertId: 0,
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0
      };
      mockConnection.execute.mockResolvedValue([executeResult as any, []]);

      await repository.save(mockAppointment);

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointments_pe'),
        expect.arrayContaining(['apt-123', '12345', 1, 'PE', 101, 201, 301, expect.any(Date), 'scheduled'])
      );
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Appointment saved to MySQL successfully', {
        appointmentId: 'apt-123',
        countryISO: 'PE',
        tableName: 'appointments_pe'
      });
    });

    it('should handle save errors', async () => {
      const error = new Error('Database connection failed');
      mockConnection.execute.mockRejectedValue(error);

      await expect(repository.save(mockAppointment)).rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save appointment to MySQL', {
        appointmentId: 'apt-123',
        countryISO: 'PE',
        error: 'Database connection failed'
      });
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle CL country correctly', async () => {
      const clAppointment = {
        ...mockAppointment,
        getCountryISO: () => ({ getValue: () => 'CL' }),
        toJSON: () => ({
          ...mockAppointment.toJSON(),
          appointmentId: 'apt-456'
        })
      } as any;

      const executeResult = {
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        insertId: 0,
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0
      };
      mockConnection.execute.mockResolvedValue([executeResult as any, []]);

      await repository.save(clAppointment);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointments_cl'),
        expect.arrayContaining(['apt-456'])
      );
    });
  });

  describe('findByAppointmentId', () => {
    const appointmentId = { getValue: () => 'apt-123' } as any;

    it('should find appointment in first table', async () => {
      const mockRow = {
        appointment_id: 'apt-123',
        insured_id: '12345',
        schedule_id: 1,
        country_iso: 'PE',
        center_id: 101,
        specialty_id: 201,
        medic_id: 301,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z')
      };

      const mockAppointment = { id: 'apt-123' };
      const { Appointment } = require('@medical-appointment/core-domain');
      jest.spyOn(Appointment, 'fromPrimitives').mockReturnValue(mockAppointment);

      mockConnection.execute.mockResolvedValueOnce([[mockRow] as any, []]);

      const result = await repository.findByAppointmentId(appointmentId);

      expect(result).toBe(mockAppointment);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['apt-123']
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Appointment retrieved from MySQL successfully', {
        appointmentId: 'apt-123',
        tableName: 'appointments_pe'
      });
    });

    it('should search in second table if not found in first', async () => {
      const mockRow = {
        appointment_id: 'apt-123',
        insured_id: '12345',
        schedule_id: 1,
        country_iso: 'CL',
        center_id: 101,
        specialty_id: 201,
        medic_id: 301,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z')
      };

      const mockAppointment = { id: 'apt-123' };
      const { Appointment } = require('@medical-appointment/core-domain');
      jest.spyOn(Appointment, 'fromPrimitives').mockReturnValue(mockAppointment);

      mockConnection.execute
        .mockResolvedValueOnce([[] as any, []]) // First table empty
        .mockResolvedValueOnce([[mockRow] as any, []]); // Second table has result

      const result = await repository.findByAppointmentId(appointmentId);

      expect(result).toBe(mockAppointment);
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Appointment retrieved from MySQL successfully', {
        appointmentId: 'apt-123',
        tableName: 'appointments_cl'
      });
    });

    it('should return null if appointment not found', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[] as any, []]) // First table empty
        .mockResolvedValueOnce([[] as any, []]); // Second table empty

      const result = await repository.findByAppointmentId(appointmentId);

      expect(result).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith('Appointment not found in MySQL', {
        appointmentId: 'apt-123'
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockConnection.execute.mockRejectedValue(error);

      await expect(repository.findByAppointmentId(appointmentId)).rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to find appointment in MySQL', {
        appointmentId: 'apt-123',
        error: 'Database error'
      });
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('findByInsuredId', () => {
    const insuredId = { getValue: () => '12345', getMaskedValue: () => '***45' } as any;

    it('should find appointments across both tables and sort them', async () => {
      const mockRows1 = [{
        appointment_id: 'apt-1',
        insured_id: '12345',
        schedule_id: 1,
        country_iso: 'PE',
        center_id: 101,
        specialty_id: 201,
        medic_id: 301,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-02T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z')
      }];

      const mockRows2 = [{
        appointment_id: 'apt-2',
        insured_id: '12345',
        schedule_id: 2,
        country_iso: 'CL',
        center_id: 102,
        specialty_id: 202,
        medic_id: 302,
        appointment_date: new Date('2024-01-16T10:00:00Z'),
        status: 'completed',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z')
      }];

      const mockAppointment1 = { 
        id: 'apt-1', 
        getCreatedAt: () => new Date('2024-01-02T00:00:00Z'),
        getTime: () => new Date('2024-01-02T00:00:00Z').getTime()
      };
      const mockAppointment2 = { 
        id: 'apt-2',
        getCreatedAt: () => new Date('2024-01-01T00:00:00Z'),
        getTime: () => new Date('2024-01-01T00:00:00Z').getTime()
      };

      const { Appointment } = require('@medical-appointment/core-domain');
      jest.spyOn(Appointment, 'fromPrimitives')
        .mockReturnValueOnce(mockAppointment1)
        .mockReturnValueOnce(mockAppointment2);

      mockConnection.execute
        .mockResolvedValueOnce([mockRows1 as any, []])
        .mockResolvedValueOnce([mockRows2 as any, []]);

      const result = await repository.findByInsuredId(insuredId);

      expect(result).toHaveLength(2);
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Appointments retrieved by insured ID from MySQL', {
        insuredId: '***45',
        count: 2
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockConnection.execute.mockRejectedValue(error);

      await expect(repository.findByInsuredId(insuredId)).rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to find appointments by insured ID in MySQL', {
        insuredId: '***45',
        error: 'Database error'
      });
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockAppointment = {
      getAppointmentId: () => ({ getValue: () => 'apt-123' }),
      getCountryISO: () => ({ getValue: () => 'PE' }),
      toJSON: () => ({
        appointmentId: 'apt-123',
        status: 'completed'
      })
    } as any;

    it('should update appointment successfully', async () => {
      const executeResult = {
        affectedRows: 1,
        fieldCount: 0,
        info: '',
        insertId: 0,
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0
      };
      mockConnection.execute.mockResolvedValue([executeResult as any, []]);

      await repository.update(mockAppointment);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE appointments_pe'),
        ['completed', 'apt-123']
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Appointment updated in MySQL successfully', {
        appointmentId: 'apt-123',
        status: 'completed',
        tableName: 'appointments_pe'
      });
    });

    it('should throw error when no rows affected', async () => {
      const executeResult = {
        affectedRows: 0,
        fieldCount: 0,
        info: '',
        insertId: 0,
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0
      };
      mockConnection.execute.mockResolvedValue([executeResult as any, []]);

      await expect(repository.update(mockAppointment)).rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update appointment in MySQL', {
        appointmentId: 'apt-123',
        error: 'No appointment found with ID apt-123'
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockConnection.execute.mockRejectedValue(error);

      await expect(repository.update(mockAppointment)).rejects.toThrow(DatabaseConnectionError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update appointment in MySQL', {
        appointmentId: 'apt-123',
        error: 'Database error'
      });
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('closeConnection', () => {
    it('should close connection pool successfully', async () => {
      await repository.closeConnection();

      expect(mockPool.end).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('MySQL connection pool closed successfully');
    });

    it('should handle connection close errors', async () => {
      const error = new Error('Close error');
      mockPool.end.mockRejectedValue(error);

      await repository.closeConnection();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to close MySQL connection pool', {
        error: 'Close error'
      });
    });
  });

  describe('getTableNameByCountry', () => {
    it('should return correct table names for supported countries', () => {
      // Access private method for testing
      const getTableNameByCountry = (repository as any).getTableNameByCountry.bind(repository);

      expect(getTableNameByCountry('PE')).toBe('appointments_pe');
      expect(getTableNameByCountry('CL')).toBe('appointments_cl');
      expect(getTableNameByCountry('pe')).toBe('appointments_pe');
      expect(getTableNameByCountry('cl')).toBe('appointments_cl');
    });

    it('should throw error for unsupported countries', () => {
      const getTableNameByCountry = (repository as any).getTableNameByCountry.bind(repository);

      expect(() => getTableNameByCountry('US')).toThrow('Unsupported country: US');
      expect(() => getTableNameByCountry('BR')).toThrow('Unsupported country: BR');
    });
  });

  describe('mapToAppointment', () => {
    const { Appointment } = require('@medical-appointment/core-domain');

    it('should map database row to Appointment object', () => {
      const mockRow = {
        appointment_id: 'apt-123',
        insured_id: '12345',
        schedule_id: 1,
        country_iso: 'PE',
        center_id: 101,
        specialty_id: 201,
        medic_id: 301,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z')
      };

      // Access private method for testing
      const mapToAppointment = (repository as any).mapToAppointment.bind(repository);

      // Mock Appointment.fromPrimitives
      const mockAppointment = { id: 'apt-123' };
      jest.spyOn(Appointment, 'fromPrimitives').mockReturnValue(mockAppointment as any);

      const result = mapToAppointment(mockRow);

      expect(Appointment.fromPrimitives).toHaveBeenCalledWith({
        appointmentId: 'apt-123',
        countryISO: 'PE',
        createdAt: mockRow.created_at,
        insuredId: '12345',
        processedAt: mockRow.updated_at,
        schedule: {
          centerId: 101,
          date: mockRow.appointment_date,
          medicId: 301,
          scheduleId: 1,
          specialtyId: 201
        },
        status: 'scheduled',
        updatedAt: mockRow.updated_at
      });

      expect(result).toBe(mockAppointment);
    });

    it('should handle null updated_at field', () => {
      const mockRow = {
        appointment_id: 'apt-123',
        insured_id: '12345',
        schedule_id: 1,
        country_iso: 'PE',
        center_id: null,
        specialty_id: null,
        medic_id: null,
        appointment_date: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: null
      };

      const mapToAppointment = (repository as any).mapToAppointment.bind(repository);
      const mockAppointment = { id: 'apt-123' };
      jest.spyOn(Appointment, 'fromPrimitives').mockReturnValue(mockAppointment as any);

      mapToAppointment(mockRow);

      expect(Appointment.fromPrimitives).toHaveBeenCalledWith({
        appointmentId: 'apt-123',
        countryISO: 'PE',
        createdAt: mockRow.created_at,
        insuredId: '12345',
        processedAt: null,
        schedule: {
          centerId: 0,
          date: mockRow.appointment_date,
          medicId: 0,
          scheduleId: 1,
          specialtyId: 0
        },
        status: 'scheduled',
        updatedAt: new Date(mockRow.updated_at!)
      });
    });
  });
});
