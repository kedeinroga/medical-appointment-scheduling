// Third-party imports
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';

// Domain imports
import { 
  Appointment,
  AppointmentId,
  AppointmentStatus,
  IAppointmentRepository,
  InsuredId
} from '@medical-appointment/core-domain';

// Infrastructure imports
import { DynamoDBError } from '../../errors/aws.errors';
import { AppointmentNotFoundError } from '@medical-appointment/shared';
import { AWS_CONFIG } from '../../config/aws.config';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * DynamoDB implementation of the Appointment Repository
 * Follows the Repository pattern to abstract data persistence concerns
 * Uses @Singleton decorator to ensure only one instance manages the DynamoDB connection
 */
@Singleton
export class DynamoDBAppointmentRepository implements IAppointmentRepository {
  private readonly dynamoClient: DynamoDBDocumentClient;
  private readonly logger: Logger;
  private readonly tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: AWS_CONFIG.AWS_REGION
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.logger = new Logger({
      serviceName: 'dynamodb-appointment-repository'
    });
    this.tableName = AWS_CONFIG.APPOINTMENTS_TABLE_NAME;
  }

  async save(appointment: Appointment): Promise<void> {
    try {
      const item = this.mapToStorageFormat(appointment);

      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(appointmentId) OR #status = :pendingStatus',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':pendingStatus': AppointmentStatus.PENDING.getValue()
        }
      }));

      this.logger.info('Appointment saved successfully', appointment.toLogSafeJSON());
    } catch (error) {
      this.logger.error('Failed to save appointment', {
        ...appointment.toLogSafeJSON(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DynamoDBError('save', error as Error);
    }
  }

  async findByAppointmentId(appointmentId: AppointmentId): Promise<Appointment> {
    try {
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          appointmentId: appointmentId.getValue()
        }
      }));

      if (!result.Item) {
        this.logger.info('Appointment not found', {
          appointmentId: appointmentId.getValue()
        });
        throw new AppointmentNotFoundError(appointmentId.getValue());
      }

      const appointment = this.mapFromStorageFormat(result.Item);
      
      this.logger.info('Appointment retrieved successfully', appointment.toLogSafeJSON());

      return appointment;
    } catch (error) {
      this.logger.error('Failed to find appointment by ID', {
        appointmentId: appointmentId.getValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DynamoDBError('findByAppointmentId', error as Error);
    }
  }

  async findByInsuredId(insuredId: InsuredId): Promise<Appointment[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'insuredId-createdAt-index',
        KeyConditionExpression: 'insuredId = :insuredId',
        ExpressionAttributeValues: {
          ':insuredId': insuredId.getValue()
        },
        ScanIndexForward: false // Most recent first
      }));

      const appointments = (result.Items || []).map(item => 
        this.mapFromStorageFormat(item)
      );

      this.logger.info('Appointments retrieved by insured ID', {
        insuredId: insuredId.getMaskedValue(),
        count: appointments.length
      });

      return appointments;
    } catch (error) {
      this.logger.error('Failed to find appointments by insured ID', {
        insuredId: insuredId.getMaskedValue(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DynamoDBError('findByInsuredId', error as Error);
    }
  }

  async update(appointment: Appointment): Promise<void> {
    try {
      const item = this.mapToStorageFormat(appointment);

      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          appointmentId: appointment.getAppointmentId().getValue()
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, processedAt = :processedAt',
        ConditionExpression: 'attribute_exists(appointmentId)',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': item.status,
          ':updatedAt': item.updatedAt,
          ':processedAt': item.processedAt
        }
      }));

      this.logger.info('Appointment updated successfully', appointment.toLogSafeJSON());
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new AppointmentNotFoundError(appointment.getAppointmentId().getValue());
      }

      this.logger.error('Failed to update appointment', {
        ...appointment.toLogSafeJSON(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DynamoDBError('update', error as Error);
    }
  }

  private mapToStorageFormat(appointment: Appointment): Record<string, any> {
    const json = appointment.toJSON();
    return {
      appointmentId: json.appointmentId,
      countryISO: json.countryISO,
      createdAt: json.createdAt,
      insuredId: json.insuredId,
      processedAt: json.processedAt,
      scheduleId: json.schedule.scheduleId,
      status: json.status,
      updatedAt: json.updatedAt,
      // Store full schedule data for completeness
      schedule: json.schedule
    };
  }

  private mapFromStorageFormat(item: Record<string, any>): Appointment {
    return Appointment.fromPrimitives({
      appointmentId: item.appointmentId,
      countryISO: item.countryISO,
      createdAt: new Date(item.createdAt),
      insuredId: item.insuredId,
      processedAt: item.processedAt ? new Date(item.processedAt) : null,
      schedule: {
        centerId: item.schedule?.centerId || 0,
        date: new Date(item.schedule?.date || item.createdAt),
        medicId: item.schedule?.medicId || 0,
        scheduleId: item.scheduleId,
        specialtyId: item.schedule?.specialtyId || 0
      },
      status: item.status,
      updatedAt: new Date(item.updatedAt)
    });
  }
}
