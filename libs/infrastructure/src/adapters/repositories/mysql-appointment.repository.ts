// Third-party imports
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Logger } from '@aws-lambda-powertools/logger';

// Domain imports
import { 
  Appointment,
  AppointmentId,
  IAppointmentRepository,
  InsuredId
} from '@medical-appointment/core-domain';

// Infrastructure imports
import { AWS_CONFIG } from '../../config/aws.config';
import { AppointmentNotFoundError, DatabaseConnectionError } from '../../errors/aws.errors';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * MySQL implementation of the Appointment Repository for RDS
 * Handles country-specific appointment data storage according to requirements
 * - appointment_pe table for Peru appointments
 * - appointment_cl table for Chile appointments
 * Uses @Singleton decorator to ensure efficient connection pool management
 */
@Singleton
export class MySQLAppointmentRepository implements IAppointmentRepository {
  private readonly logger: Logger;
  private pool: Pool;

  constructor() {
    this.logger = new Logger({
      serviceName: 'mysql-appointment-repository'
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

  async save(appointment: Appointment): Promise<void> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const tableName = this.getTableNameByCountry(appointment.getCountryISO().getValue());
      const appointmentJson = appointment.toJSON();

      const insertQuery = `
        INSERT INTO ${tableName} (
          appointment_id,
          insured_id,
          schedule_id,
          country_iso,
          center_id,
          specialty_id,
          medic_id,
          appointment_date,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          updated_at = NOW()
      `;

      await connection.execute(insertQuery, [
        appointmentJson.appointmentId,
        appointmentJson.insuredId,
        appointmentJson.schedule.scheduleId,
        appointment.getCountryISO().getValue(),
        appointmentJson.schedule.centerId,
        appointmentJson.schedule.specialtyId,
        appointmentJson.schedule.medicId,
        appointmentJson.schedule.date,
        appointmentJson.status
      ]);

      this.logger.info('Appointment saved to MySQL successfully', {
        appointmentId: appointmentJson.appointmentId,
        countryISO: appointment.getCountryISO().getValue(),
        tableName
      });

    } catch (error) {
      this.logger.error('Failed to save appointment to MySQL', {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: appointment.getCountryISO().getValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('save', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async findByAppointmentId(appointmentId: AppointmentId): Promise<Appointment> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      // Search in both tables since we don't know the country
      const tables = ['appointments_pe', 'appointments_cl'];
      
      for (const tableName of tables) {
        const selectQuery = `
          SELECT 
            appointment_id,
            insured_id,
            schedule_id,
            country_iso,
            center_id,
            specialty_id,
            medic_id,
            appointment_date,
            status,
            created_at,
            updated_at
          FROM ${tableName} 
          WHERE appointment_id = ?
          LIMIT 1
        `;

        const [rows] = await connection.execute(selectQuery, [appointmentId.getValue()]);
        const rowsArray = rows as any[];

        if (rowsArray && rowsArray.length > 0) {
          const row = rowsArray[0];
          const appointment = this.mapToAppointment(row);
          
          this.logger.info('Appointment retrieved from MySQL successfully', {
            appointmentId: appointmentId.getValue(),
            tableName
          });

          return appointment;
        }
      }

      this.logger.info('Appointment not found in MySQL', {
        appointmentId: appointmentId.getValue()
      });
      throw new AppointmentNotFoundError(appointmentId.getValue());

    } catch (error) {
      this.logger.error('Failed to find appointment in MySQL', {
        appointmentId: appointmentId.getValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('findByAppointmentId', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async findByInsuredId(insuredId: InsuredId): Promise<Appointment[]> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const appointments: Appointment[] = [];
      const tables = ['appointments_pe', 'appointments_cl'];
      
      for (const tableName of tables) {
        const selectQuery = `
          SELECT 
            appointment_id,
            insured_id,
            schedule_id,
            country_iso,
            center_id,
            specialty_id,
            medic_id,
            appointment_date,
            status,
            created_at,
            updated_at
          FROM ${tableName} 
          WHERE insured_id = ?
          ORDER BY created_at DESC
        `;

        const [rows] = await connection.execute(selectQuery, [insuredId.getValue()]);
        const rowsArray = rows as any[];

        const tableAppointments = rowsArray.map(row => this.mapToAppointment(row));
        appointments.push(...tableAppointments);
      }

      // Sort by creation date descending
      appointments.sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());

      this.logger.info('Appointments retrieved by insured ID from MySQL', {
        insuredId: insuredId.getMaskedValue(),
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Failed to find appointments by insured ID in MySQL', {
        insuredId: insuredId.getMaskedValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('findByInsuredId', error as Error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async update(appointment: Appointment): Promise<void> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.pool.getConnection();
      
      const tableName = this.getTableNameByCountry(appointment.getCountryISO().getValue());
      const appointmentJson = appointment.toJSON();

      const updateQuery = `
        UPDATE ${tableName}
        SET 
          status = ?,
          updated_at = NOW()
        WHERE appointment_id = ?
      `;

      const [result] = await connection.execute(updateQuery, [
        appointmentJson.status,
        appointmentJson.appointmentId
      ]);

      const updateResult = result as any;

      if (updateResult.affectedRows === 0) {
        throw new Error(`No appointment found with ID ${appointmentJson.appointmentId}`);
      }

      this.logger.info('Appointment updated in MySQL successfully', {
        appointmentId: appointmentJson.appointmentId,
        status: appointmentJson.status,
        tableName
      });

    } catch (error) {
      this.logger.error('Failed to update appointment in MySQL', {
        appointmentId: appointment.getAppointmentId().getValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DatabaseConnectionError('update', error as Error);
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
        return 'appointments_pe';
      case 'CL':
        return 'appointments_cl';
      default:
        throw new Error(`Unsupported country: ${countryISO}`);
    }
  }

  private mapToAppointment(row: any): Appointment {
    return Appointment.fromPrimitives({
      appointmentId: row.appointment_id,
      countryISO: row.country_iso,
      createdAt: new Date(row.created_at),
      insuredId: row.insured_id,
      processedAt: row.updated_at ? new Date(row.updated_at) : null,
      schedule: {
        centerId: row.center_id || 0,
        date: new Date(row.appointment_date),
        medicId: row.medic_id || 0,
        scheduleId: row.schedule_id,
        specialtyId: row.specialty_id || 0
      },
      status: row.status,
      updatedAt: new Date(row.updated_at)
    });
  }
}
