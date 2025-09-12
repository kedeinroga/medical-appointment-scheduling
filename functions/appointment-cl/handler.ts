/**
 * Appointment CL Lambda Handler - Clean Architecture Implementation
 * Processes SQS messages for Chile appointments with proper dependency injection
 */

// External dependencies
import { SQSEvent, SQSHandler, Context } from 'aws-lambda';

// Shared utilities
import { logBusinessError, logInfrastructureError, maskInsuredId } from '@medical-appointment/shared';

// Application layer imports  
import { ProcessAppointmentDto } from '@medical-appointment/core-use-cases';
import { ValidationError } from '@medical-appointment/shared';

// Infrastructure layer
import { UseCaseFactory } from '@medical-appointment/infrastructure';

// Handler layer imports
import { COUNTRY_PROCESSING, LOG_EVENTS } from './constants';

/**
 * Handler Dependencies
 */
interface Dependencies {
  processAppointmentUseCase: any;
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
      serviceName: 'medical-appointment-cl-processor',
      logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
    });

    // Lazy loading of use case to allow for mocking in tests
    let processAppointmentUseCase: any = null;
    
    const getProcessAppointmentUseCase = () => {
      if (!processAppointmentUseCase) {
        processAppointmentUseCase = UseCaseFactory.createProcessAppointmentUseCase();
      }
      return processAppointmentUseCase;
    };

    this.dependencies = {
      processAppointmentUseCase: {
        execute: (...args: any[]) => getProcessAppointmentUseCase().execute(...args)
      },
      logger
    };

    return this.dependencies;
  }

  static reset() {
    this.dependencies = null;
  }
}

/**
 * Message Processing Service
 */
class MessageProcessor {
  constructor(private deps: Dependencies) {}

  async processRecord(record: any, requestId: string) {
    const messageId = record.messageId;

    try {
      // Parse SNS message
      const snsMessage = JSON.parse(record.body);
      const appointmentData = JSON.parse(snsMessage.Message);

      // Validate country
      if (appointmentData.countryISO !== 'CL') {
        this.deps.logger.info('Skipping message - wrong country', {
          messageId,
          country: appointmentData.countryISO,
          expected: 'CL'
        });
        return { messageId, skipped: true, reason: 'wrong_country' };
      }

      // Create DTO
      const processDto: ProcessAppointmentDto = {
        appointmentId: appointmentData.appointmentId,
        insuredId: appointmentData.insuredId,
        countryISO: appointmentData.countryISO,
        scheduleId: appointmentData.scheduleId
      };

      // Execute use case
      await this.deps.processAppointmentUseCase.execute(processDto);

      this.deps.logger.info('Appointment processed successfully', {
        logId: LOG_EVENTS.CL_APPOINTMENT_PROCESSED.logId,
        messageId,
        appointmentId: appointmentData.appointmentId,
        insuredId: maskInsuredId(appointmentData.insuredId),
        country: 'CL'
      });

      return { messageId, success: true };

    } catch (error) {
      const err = error as Error;
      
      if (error instanceof ValidationError) {
        logBusinessError(this.deps.logger, err, { messageId, requestId });
        return { 
          messageId, 
          success: false, 
          error: { type: 'validation', message: err.message }
        };
      }

      logInfrastructureError(this.deps.logger, err, { messageId, requestId });
      return { 
        messageId, 
        success: false, 
        error: { type: 'infrastructure', message: err.message }
      };
    }
  }
}

/**
 * Batch Processing Service
 */
class BatchProcessor {
  constructor(
    private deps: Dependencies,
    private messageProcessor: MessageProcessor
  ) {}

  async processBatch(event: SQSEvent, requestId: string) {
    const startTime = Date.now();
    const totalRecords = event.Records.length;

    this.deps.logger.info('Starting batch processing', {
      logId: LOG_EVENTS.CL_APPOINTMENT_PROCESSING_STARTED.logId,
      requestId,
      totalRecords,
      targetCountry: 'CL'
    });

    const results = [];
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const record of event.Records) {
      const result = await this.messageProcessor.processRecord(record, requestId);
      results.push(result);

      if (result.success) processed++;
      else if (result.skipped) skipped++;
      else failed++;
    }

    const executionTime = Date.now() - startTime;

    this.deps.logger.info('Batch processing completed', {
      logId: LOG_EVENTS.CL_APPOINTMENT_PROCESSED.logId,
      requestId,
      totalRecords,
      processed,
      failed,
      skipped,
      executionTime
    });

    return {
      totalRecords,
      processed,
      failed,
      skipped,
      executionTime,
      results
    };
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

    // Step 2: Create services with dependency injection
    const messageProcessor = new MessageProcessor(dependencies);
    const batchProcessor = new BatchProcessor(dependencies, messageProcessor);

    // Step 3: Process batch
    const summary = await batchProcessor.processBatch(event, requestId);

    // Step 4: Handle partial failures
    if (summary.failed > 0) {
      dependencies.logger.warn('Some records failed processing', {
        requestId,
        failedCount: summary.failed,
        totalRecords: summary.totalRecords
      });
    }

  } catch (error) {
    const dependencies = DependencyFactory.create();
    logInfrastructureError(dependencies.logger, error as Error, { 
      requestId, 
      operation: 'batch-processing' 
    });
    
    throw error;
  }
};
