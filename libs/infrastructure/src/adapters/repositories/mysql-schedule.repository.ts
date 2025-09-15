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
import { DatabaseConnectionError, ScheduleNotFoundError } from '../../errors/aws.errors';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * MySQL implementation of the Schedule Repository for RDS
 * Handles country-specific schedule data storage and retrieval
 * Uses @Singleton decorator to ensure efficient connection pool management
 */
@Singleton
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
      
      const scheduleJson = schedule.toJSON();

      const insertQuery = `
        INSERT INTO schedules (
          center_id,
          specialty_id,
          medic_id,
          available_date,
          is_available,
          country_iso
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          is_available = VALUES(is_available),
          updated_at = CURRENT_TIMESTAMP
      `;

      await connection.execute(insertQuery, [
        scheduleJson.centerId,
        scheduleJson.specialtyId,
        scheduleJson.medicId,
        scheduleJson.date,
        true,
        countryISO.getValue()
      ]);

      this.logger.info('Schedule saved to MySQL successfully', {
        countryISO: countryISO.getValue(),
        scheduleId: scheduleJson.scheduleId
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

  async findByScheduleId(scheduleId: number, countryISO: CountryISO): Promise<Schedule> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const selectQuery = `
        SELECT 
          center_id,
          specialty_id,
          medic_id,
          available_date,
          id as schedule_id
        FROM schedules 
        WHERE id = ? AND country_iso = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const [rows] = await connection.execute(selectQuery, [scheduleId, countryISO.getValue()]);
      const rowsArray = rows as any[];

      if (!rowsArray || rowsArray.length === 0) {
        this.logger.info('Schedule not found in MySQL', {
          countryISO: countryISO.getValue(),
          scheduleId
        });
        throw new ScheduleNotFoundError(scheduleId.toString());
      }

      const row = rowsArray[0];
      const schedule = Schedule.create({
        centerId: row.center_id,
        date: new Date(row.available_date),
        medicId: row.medic_id,
        scheduleId: row.schedule_id,
        specialtyId: row.specialty_id
      });

      this.logger.info('Schedule retrieved from MySQL successfully', {
        countryISO: countryISO.getValue(),
        scheduleId
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
      
      let selectQuery = `
        SELECT 
          center_id,
          specialty_id,
          medic_id,
          available_date,
          id as schedule_id
        FROM schedules 
        WHERE is_available = TRUE AND country_iso = ?
      `;

      const queryParams: any[] = [countryISO.getValue()];

      if (date) {
        selectQuery += ' AND DATE(available_date) = DATE(?)';
        queryParams.push(date.toISOString());
      }

      selectQuery += ' ORDER BY available_date ASC';

      const [rows] = await connection.execute(selectQuery, queryParams);
      const rowsArray = rows as any[];

      const schedules = rowsArray.map(row => 
        Schedule.create({
          centerId: row.center_id,
          date: new Date(row.available_date),
          medicId: row.medic_id,
          scheduleId: row.schedule_id,
          specialtyId: row.specialty_id
        })
      );

      this.logger.info('Available schedules retrieved from MySQL successfully', {
        countryISO: countryISO.getValue(),
        count: schedules.length
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
      
      const updateQuery = `
        UPDATE schedules
        SET is_available = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND country_iso = ?
      `;

      const [result] = await connection.execute(updateQuery, [
        scheduleId,
        countryISO.getValue()
      ]);

      const updateResult = result as any;

      if (updateResult.affectedRows === 0) {
        throw new Error(`No schedule found with ID ${scheduleId} in country ${countryISO.getValue()}`);
      }

      this.logger.info('Schedule marked as reserved successfully', {
        countryISO: countryISO.getValue(),
        scheduleId
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
}
