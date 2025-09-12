/**
 * Appointment Completion Lambda Handler - Clean Architecture Implementation
 * Processes SQS messages for appointment completion with proper dependency injection
 */

// External dependencies
import { SQSEvent, SQSHandler, Context } from 'aws-lambda';

// Shared utilities
import { logBusinessError, logInfrastructureError, maskInsuredId } from '@medical-appointment/shared';

// Application layer imports  
import { CompleteAppointmentDto } from '@medical-appointment/core-use-cases';
import { ValidationError } from '@medical-appointment/shared';

// Infrastructure layer
import { UseCaseFactory } from '@medical-appointment/infrastructure';

// Handler layer imports
import { LOG_EVENTS } from './constants';

/**
 * Handler Dependencies
 */
interface Dependencies {
  completeAppointmentUseCase: any;
  logger: any;
}

/**
 * Dependency Factory with lazy loading
 */
class DependencyFactory {
  private static dependencies: Dependencies | null = null;

  static create(): Dependencies {
    if (this.dependencies) {
      return this.dependencies;
    }

    const { Logger } = require('@aws-lambda-powertools/logger');
    
    const logger = new Logger({
      serviceName: 'medical-appointment-completion-processor',
      logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
    });

    this.dependencies = {
      completeAppointmentUseCase: UseCaseFactory.createCompleteAppointmentUseCase(),
      logger
    };

    return this.dependencies;
  }

  static reset() {
    this.dependencies = null;
  }
}

/**
 * Event Processing Service
 */
class EventProcessor {
  constructor(private deps: Dependencies) {}

  async processEvent(eventData: any, requestId: string) {
    try {
      // Handle EventBridge format (with detail wrapper)
      let actualData = eventData;
      if (eventData.detail && eventData['detail-type']) {
        actualData = eventData.detail;
      }

      // Validate required fields
      if (!actualData.appointmentId || !actualData.insuredId || !actualData.countryISO || !actualData.scheduleId) {
        throw new ValidationError('MISSING_REQUIRED_FIELDS', 'Missing required fields for appointment completion');
      }

      // Validate that status is PROCESSED
      if (actualData.status?.toLowerCase() !== 'processed') {
        this.deps.logger.info('Skipping event - status not PROCESSED', {
          appointmentId: actualData.appointmentId,
          currentStatus: actualData.status,
          expectedStatus: 'PROCESSED'
        });
        return { skipped: true, reason: 'status_not_processed' };
      }

      // Create DTO
      const completeDto: CompleteAppointmentDto = {
        appointmentId: actualData.appointmentId,
        insuredId: actualData.insuredId,
        countryISO: actualData.countryISO,
        scheduleId: actualData.scheduleId
      };

      // Execute use case
      await this.deps.completeAppointmentUseCase.execute(completeDto);

      this.deps.logger.info('Appointment completed successfully', {
        logId: LOG_EVENTS.APPOINTMENT_COMPLETED.logId,
        appointmentId: actualData.appointmentId,
        insuredId: maskInsuredId(actualData.insuredId),
        country: actualData.countryISO,
        scheduleId: actualData.scheduleId
      });

      return { success: true };

    } catch (error) {
      const err = error as Error;
      
      if (error instanceof ValidationError) {
        logBusinessError(this.deps.logger, err, { requestId });
        return { 
          success: false, 
          error: { type: 'validation', message: err.message }
        };
      }

      logInfrastructureError(this.deps.logger, err, { requestId });
      return { 
        success: false, 
        error: { type: 'infrastructure', message: err.message }
      };
    }
  }
}

/**
 * Main Lambda Handler
 */
export const main: SQSHandler = async (event: SQSEvent, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;

  try {
    // Step 1: Create dependencies (Infrastructure -> Use Cases)
    const dependencies = DependencyFactory.create();

    // Step 2: Create service with dependency injection
    const eventProcessor = new EventProcessor(dependencies);

    // Step 3: Process each SQS record
    dependencies.logger.info('Processing appointment completion batch', {
      logId: LOG_EVENTS.APPOINTMENT_COMPLETION_STARTED.logId,
      requestId,
      recordCount: event.Records.length
    });

    for (const record of event.Records) {
      try {
        // Parse the SQS record body
        const eventData = JSON.parse(record.body);
        
        const result = await eventProcessor.processEvent(eventData, requestId);

        if (result.skipped) {
          dependencies.logger.info('Event processing skipped', {
            messageId: record.messageId,
            reason: result.reason
          });
        } else if (result.success) {
          dependencies.logger.info('Event processed successfully', {
            logId: LOG_EVENTS.APPOINTMENT_COMPLETED.logId,
            messageId: record.messageId
          });
        } else {
          dependencies.logger.error('Event processing failed', {
            messageId: record.messageId,
            error: result.error
          });
        }
      } catch (parseError) {
        dependencies.logger.error('Failed to parse SQS record body', {
          messageId: record.messageId,
          error: (parseError as Error).message
        });
        // Continue processing other records
      }
    }

  } catch (error) {
    const dependencies = DependencyFactory.create();
    logInfrastructureError(dependencies.logger, error as Error, { 
      requestId, 
      operation: 'batch-completion-processing' 
    });
    
    throw error;
  }
};
