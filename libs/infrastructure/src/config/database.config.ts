import { Pool, createPool } from 'mysql2/promise';

import { AWS_CONFIG } from './aws.config';

/**
 * Database configuration for MySQL RDS connection
 * Manages connection pools for country-specific databases
 */
export class DatabaseConfig {
  private static pools: Map<string, Pool> = new Map();

  /**
   * Gets or creates a connection pool for a specific country
   */
  public static getPool(countryISO?: string): Pool {
    const poolKey = countryISO ? `pool_${countryISO.toLowerCase()}` : 'default_pool';
    
    if (!this.pools.has(poolKey)) {
      const pool = this.createPool(countryISO);
      this.pools.set(poolKey, pool);
    }

    return this.pools.get(poolKey)!;
  }

  /**
   * Creates a new MySQL connection pool
   */
  private static createPool(countryISO?: string): Pool {
    const databaseName = countryISO 
      ? `medical_appointments_${countryISO.toLowerCase()}_${AWS_CONFIG.STAGE}`
      : `medical_appointments_${AWS_CONFIG.STAGE}`;

    return createPool({
      connectionLimit: 10,
      database: databaseName,
      host: AWS_CONFIG.RDS_HOST,
      password: AWS_CONFIG.RDS_PASSWORD,
      port: AWS_CONFIG.RDS_PORT,
      user: AWS_CONFIG.RDS_USERNAME
    });
  }

  /**
   * Closes all connection pools
   */
  public static async closeAllPools(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map(pool => pool.end());
    await Promise.all(closePromises);
    this.pools.clear();
  }

  /**
   * Gets database configuration for a specific country
   */
  public static getDatabaseConfig(countryISO: string) {
    return {
      database: `medical_appointments_${countryISO.toLowerCase()}_${AWS_CONFIG.STAGE}`,
      host: AWS_CONFIG.RDS_HOST,
      password: AWS_CONFIG.RDS_PASSWORD,
      port: AWS_CONFIG.RDS_PORT,
      user: AWS_CONFIG.RDS_USERNAME
    };
  }

  /**
   * Validates database connection configuration
   */
  public static validateDatabaseConfig(): void {
    const requiredConfigs = ['RDS_HOST', 'RDS_USERNAME', 'RDS_PASSWORD'] as const;
    
    const missingConfigs = requiredConfigs.filter(
      config => !AWS_CONFIG[config]
    );

    if (missingConfigs.length > 0) {
      throw new Error(
        `Missing required database configuration: ${missingConfigs.join(', ')}`
      );
    }
  }
}
