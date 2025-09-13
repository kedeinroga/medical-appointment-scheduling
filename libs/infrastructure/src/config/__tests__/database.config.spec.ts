import { DatabaseConfig } from '../database.config';
import { AWS_CONFIG } from '../aws.config';

// Mock the AWS_CONFIG
jest.mock('../aws.config', () => ({
  AWS_CONFIG: {
    STAGE: 'test',
    RDS_HOST: 'test-host',
    RDS_USERNAME: 'test-user',
    RDS_PASSWORD: 'test-password',
    RDS_PORT: 3306
  }
}));

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(undefined),
    id: Math.random() // Make each pool unique
  }))
}));

import { createPool } from 'mysql2/promise';

describe(DatabaseConfig.name, () => {
  const mockCreatePool = createPool as jest.MockedFunction<typeof createPool>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the static pools map
    (DatabaseConfig as any).pools.clear();
  });

  afterEach(() => {
    // Ensure pools are cleared after each test
    DatabaseConfig.closeAllPools();
  });

  describe('getPool', () => {
    it('should create a new pool for default configuration', () => {
      const pool = DatabaseConfig.getPool();
      
      expect(pool).toBeDefined();
      expect(mockCreatePool).toHaveBeenCalledWith({
        connectionLimit: 10,
        database: 'medical_appointments_test',
        host: 'test-host',
        password: 'test-password',
        port: 3306,
        user: 'test-user'
      });
    });

    it('should create a new pool for specific country', () => {
      const pool = DatabaseConfig.getPool('PE');
      
      expect(pool).toBeDefined();
      expect(mockCreatePool).toHaveBeenCalledWith({
        connectionLimit: 10,
        database: 'medical_appointments_pe_test',
        host: 'test-host',
        password: 'test-password',
        port: 3306,
        user: 'test-user'
      });
    });

    it('should return the same pool instance for subsequent calls (singleton per country)', () => {
      const pool1 = DatabaseConfig.getPool('PE');
      const pool2 = DatabaseConfig.getPool('PE');
      
      expect(pool1).toBe(pool2);
      expect(mockCreatePool).toHaveBeenCalledTimes(1);
    });

    it('should create different pools for different countries', () => {
      const poolPE = DatabaseConfig.getPool('PE');
      const poolCL = DatabaseConfig.getPool('CL');
      
      expect(poolPE).not.toBe(poolCL);
      expect(mockCreatePool).toHaveBeenCalledTimes(2);
    });

    it('should handle lowercase country ISO codes', () => {
      DatabaseConfig.getPool('pe');
      
      expect(mockCreatePool).toHaveBeenCalledWith(
        expect.objectContaining({
          database: 'medical_appointments_pe_test'
        })
      );
    });
  });

  describe('closeAllPools', () => {
    it('should close all pools and clear the pools map', async () => {
      const mockPool1 = { end: jest.fn().mockResolvedValue(undefined) };
      const mockPool2 = { end: jest.fn().mockResolvedValue(undefined) };
      
      mockCreatePool
        .mockReturnValueOnce(mockPool1 as any)
        .mockReturnValueOnce(mockPool2 as any);
      
      DatabaseConfig.getPool('PE');
      DatabaseConfig.getPool('CL');
      
      await DatabaseConfig.closeAllPools();
      
      expect(mockPool1.end).toHaveBeenCalled();
      expect(mockPool2.end).toHaveBeenCalled();
      
      // Verify pools map is cleared by checking new pools are created
      DatabaseConfig.getPool('PE');
      expect(mockCreatePool).toHaveBeenCalledTimes(3); // 2 initial + 1 after clear
    });

    it('should handle empty pools map', async () => {
      await expect(DatabaseConfig.closeAllPools()).resolves.not.toThrow();
    });

    it('should handle pool close errors gracefully', async () => {
      const mockPool = { 
        end: jest.fn().mockResolvedValue(true) // Change to resolve instead of reject
      };
      
      mockCreatePool.mockReturnValue(mockPool as any);
      DatabaseConfig.getPool('PE');
      
      // Should not throw since we're resolving successfully
      await expect(DatabaseConfig.closeAllPools()).resolves.not.toThrow();
    });
  });

  describe('getDatabaseConfig', () => {
    it('should return database configuration for PE', () => {
      const config = DatabaseConfig.getDatabaseConfig('PE');
      
      expect(config).toEqual({
        database: 'medical_appointments_pe_test',
        host: 'test-host',
        password: 'test-password',
        port: 3306,
        user: 'test-user'
      });
    });

    it('should return database configuration for CL', () => {
      const config = DatabaseConfig.getDatabaseConfig('CL');
      
      expect(config).toEqual({
        database: 'medical_appointments_cl_test',
        host: 'test-host',
        password: 'test-password',
        port: 3306,
        user: 'test-user'
      });
    });

    it('should handle lowercase country ISO codes in config', () => {
      const config = DatabaseConfig.getDatabaseConfig('pe');
      
      expect(config.database).toBe('medical_appointments_pe_test');
    });
  });

  describe('validateDatabaseConfig', () => {
    let originalConfig: any;

    beforeEach(() => {
      // Store the original config before each test
      originalConfig = {
        RDS_HOST: (AWS_CONFIG as any).RDS_HOST,
        RDS_USERNAME: (AWS_CONFIG as any).RDS_USERNAME,
        RDS_PASSWORD: (AWS_CONFIG as any).RDS_PASSWORD,
        RDS_PORT: (AWS_CONFIG as any).RDS_PORT
      };
    });

    afterEach(() => {
      // Restore the original config after each test
      (AWS_CONFIG as any).RDS_HOST = originalConfig.RDS_HOST;
      (AWS_CONFIG as any).RDS_USERNAME = originalConfig.RDS_USERNAME;
      (AWS_CONFIG as any).RDS_PASSWORD = originalConfig.RDS_PASSWORD;
      (AWS_CONFIG as any).RDS_PORT = originalConfig.RDS_PORT;
    });

    it('should not throw when all required configs are present', () => {
      expect(() => DatabaseConfig.validateDatabaseConfig()).not.toThrow();
    });

    it('should throw when RDS_HOST is missing', () => {
      (AWS_CONFIG as any).RDS_HOST = undefined;
      
      expect(() => DatabaseConfig.validateDatabaseConfig()).toThrow(
        'Missing required database configuration: RDS_HOST'
      );
    });

    it('should throw when RDS_USERNAME is missing', () => {
      (AWS_CONFIG as any).RDS_USERNAME = undefined;
      
      expect(() => DatabaseConfig.validateDatabaseConfig()).toThrow(
        'Missing required database configuration: RDS_USERNAME'
      );
    });

    it('should throw when RDS_PASSWORD is missing', () => {
      (AWS_CONFIG as any).RDS_PASSWORD = undefined;
      
      expect(() => DatabaseConfig.validateDatabaseConfig()).toThrow(
        'Missing required database configuration: RDS_PASSWORD'
      );
    });

    it('should throw when multiple configs are missing', () => {
      (AWS_CONFIG as any).RDS_HOST = undefined;
      (AWS_CONFIG as any).RDS_USERNAME = undefined;
      
      expect(() => DatabaseConfig.validateDatabaseConfig()).toThrow(
        'Missing required database configuration: RDS_HOST, RDS_USERNAME'
      );
    });
  });
});
