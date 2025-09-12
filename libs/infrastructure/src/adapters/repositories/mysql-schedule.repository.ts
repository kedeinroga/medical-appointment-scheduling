// Third-party imports
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Logger } from '@aws-lambda-powertools/logger';

// Domain imports
import { 
  CountryISO,
  IScheduleRepository,
  Schedule
} from '@medical-appointment/core-domain';

// Infrastructure imports
import { AWS_CONFIG } from '../../config/aws.config';
import { DatabaseConnectionError } from '../../errors/aws.errors';

/**
 * MySQL implementation of the Schedule Repository for RDS
 * Handles country-specific schedule data storage and retrieval
 */
export class MySQLScheduleRepository implements IScheduleRepository {
  private readonly logger: Logger;
  private pool: Pool;

  constructor() {
    this.logger = new Logger({
      serviceName: 'mysql-schedule-repository'
    });
    
    this.pool = createPool({
      connectionLimit: 10,
      database: `medical_appointments_${AWS_CONFIG.STAGE}`,
      host: AWS_CONFIG.RDS_HOST,
      password: AWS_CONFIG.RDS_PASSWORD,
      port: AWS_CONFIG.RDS_PORT,
      user: AWS_CONFIG.RDS_USERNAME
    });
  }

  async save(schedule: Schedule, countryISO: CountryISO): Promise<void> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const tableName = this.getTableNameByCountry(countryISO.getValue());
      const scheduleJson = schedule.toJSON();

      const insertQuery = `
        INSERT INTO ${tableName} (
          center_id,
          country_iso,
          date,
          medic_id,
          processed_at,
          schedule_id,
          specialty_id,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          processed_at = VALUES(processed_at),
          status = VALUES(status)
      `;

      await connection.execute(insertQuery, [
        scheduleJson.centerId,
        countryISO.getValue(),
        scheduleJson.date,
        scheduleJson.medicId,
        new Date().toISOString(),
        scheduleJson.scheduleId,
        scheduleJson.specialtyId,
        'processed'
      ]);

      this.logger.info('Schedule saved to MySQL successfully', {
        countryISO: countryISO.getValue(),
        scheduleId: scheduleJson.scheduleId,
        tableName
      });

    } catch (error) {
      this.logger.error('Failed to save schedule to MySQL', {
        countryISO: countryISO.getValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('save', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async findByScheduleId(scheduleId: number, countryISO: CountryISO): Promise<Schedule | null> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const tableName = this.getTableNameByCountry(countryISO.getValue());
      
      const selectQuery = `
        SELECT 
          center_id,
          date,
          medic_id,
          schedule_id,
          specialty_id,
          status
        FROM ${tableName} 
        WHERE schedule_id = ?
        ORDER BY processed_at DESC
        LIMIT 1
      `;

      const [rows] = await connection.execute(selectQuery, [scheduleId]);
      const rowsArray = rows as any[];

      if (!rowsArray || rowsArray.length === 0) {
        this.logger.info('Schedule not found in MySQL', {
          countryISO: countryISO.getValue(),
          scheduleId,
          tableName
        });
        return null;
      }

      const row = rowsArray[0];
      const schedule = Schedule.create({
        centerId: row.center_id,
        date: new Date(row.date),
        medicId: row.medic_id,
        scheduleId: row.schedule_id,
        specialtyId: row.specialty_id
      });

      this.logger.info('Schedule retrieved from MySQL successfully', {
        countryISO: countryISO.getValue(),
        scheduleId,
        tableName
      });

      return schedule;

    } catch (error) {
      this.logger.error('Failed to find schedule in MySQL', {
        countryISO: countryISO.getValue(),
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('findByScheduleId', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async findAvailableSchedules(countryISO: CountryISO, date?: Date): Promise<Schedule[]> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const tableName = this.getTableNameByCountry(countryISO.getValue());
      
      let selectQuery = `
        SELECT 
          center_id,
          date,
          medic_id,
          schedule_id,
          specialty_id,
          status
        FROM ${tableName} 
        WHERE status = 'available'
      `;

      const queryParams: any[] = [];

      if (date) {
        selectQuery += ' AND DATE(date) = DATE(?)';
        queryParams.push(date.toISOString());
      }

      selectQuery += ' ORDER BY date ASC';

      const [rows] = await connection.execute(selectQuery, queryParams);
      const rowsArray = rows as any[];

      const schedules = rowsArray.map(row => 
        Schedule.create({
          centerId: row.center_id,
          date: new Date(row.date),
          medicId: row.medic_id,
          scheduleId: row.schedule_id,
          specialtyId: row.specialty_id
        })
      );

      this.logger.info('Available schedules retrieved from MySQL successfully', {
        countryISO: countryISO.getValue(),
        count: schedules.length,
        tableName
      });

      return schedules;

    } catch (error) {
      this.logger.error('Failed to find available schedules in MySQL', {
        countryISO: countryISO.getValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('findAvailableSchedules', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async markAsReserved(scheduleId: number, countryISO: CountryISO): Promise<void> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const tableName = this.getTableNameByCountry(countryISO.getValue());
      
      const updateQuery = `
        UPDATE ${tableName}
        SET status = 'reserved', processed_at = ?
        WHERE schedule_id = ?
      `;

      const [result] = await connection.execute(updateQuery, [
        new Date().toISOString(),
        scheduleId
      ]);

      const updateResult = result as any;

      if (updateResult.affectedRows === 0) {
        throw new Error(`No schedule found with ID ${scheduleId} in country ${countryISO.getValue()}`);
      }

      this.logger.info('Schedule marked as reserved successfully', {
        countryISO: countryISO.getValue(),
        scheduleId,
        tableName
      });

    } catch (error) {
      this.logger.error('Failed to mark schedule as reserved', {
        countryISO: countryISO.getValue(),
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('markAsReserved', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async closeConnection(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.info('MySQL connection pool closed successfully');
    } catch (error) {
      this.logger.error('Failed to close MySQL connection pool', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private getTableNameByCountry(countryISO: string): string {
    switch (countryISO.toUpperCase()) {
      case 'PE':
        return 'schedules_pe';
      case 'CL':
        return 'schedules_cl';
      default:
        throw new Error(`Unsupported country: ${countryISO}`);
    }
  }
}
