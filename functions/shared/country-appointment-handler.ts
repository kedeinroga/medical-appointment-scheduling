/**
 * Generic Country Appointment Handler - Clean Architecture Compliant
 * This belongs to the FUNCTIONS/PRESENTATION layer
 * Does NOT import from infrastructure directly - only through interfaces
 */

// External dependencies
import { SQSEvent, SQSHandler, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Application layer - Use cases and DTOs
import { ProcessCountryAppointmentDto } from '@medical-appointment/core-use-cases';

// Domain layer - Value objects and errors only
import { CountryISO } from '@medical-appointment/core-domain';

// Shared utilities (logging, masking, error handling)
import { logBusinessError, logInfrastructureError, maskInsuredId } from '@medical-appointment/shared';

/**
 * Configuration for country-specific handler (Presentation layer concern)
 */
export interface CountryHandlerConfig {
  countryCode: 'CL' | 'PE';
  serviceName: string;
  logEvents: {
    PROCESSING_STARTED: { logId: string; message: string };
    PROCESSED: { logId: string; message: string };
  };
}

/**
 * Dependencies injected from outside (Dependency Inversion)
 * This follows Clean Architecture - presentation layer receives dependencies
 */
export interface CountryHandlerDependencies {
  processAppointmentUseCase: {
    execute(dto: ProcessCountryAppointmentDto): Promise<any>; // Changed from void to any to match actual return type
  };
  logger: Logger;
}

/**
 * Message parsing result (Presentation layer DTO)
 */
export interface MessageParseResult {
  isValid: boolean;
  data?: {
    appointmentId: string;
    insuredId: string;
    countryISO: string;
    scheduleId: number;
  };
  reason?: string;
}

/**
 * Processing result (Presentation layer DTO)
 */
export interface ProcessingResult {
  messageId: string;
  success?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: {
    type: 'validation' | 'infrastructure';
    message: string;
  };
}

/**
 * Message Parser - Presentation layer utility
 * Pure function, no dependencies on other layers
 */
export class SQSMessageParser {
  static parseAndValidate(record: any, expectedCountry: string): MessageParseResult {
    try {
      // Parse message - handle both SNS wrapped and raw formats
      const messageBody = JSON.parse(record.body);
      
      let appointmentData: any;
      if (messageBody.Message) {
        // SNS wrapped format
        appointmentData = JSON.parse(messageBody.Message);
      } else {
        // Raw message format
        appointmentData = messageBody;
      }

      // Validate required fields
      const requiredFields = ['appointmentId', 'insuredId', 'countryISO', 'scheduleId'];
      const missingFields = requiredFields.filter(field => !appointmentData[field]);
      
      if (missingFields.length > 0) {
        return {
          isValid: false,
          reason: `missing_fields: ${missingFields.join(', ')}`
        };
      }

      // Validate country
      if (appointmentData.countryISO !== expectedCountry) {
        return {
          isValid: false,
          reason: 'wrong_country',
          data: appointmentData
        };
      }

      // Return validated data
      return {
        isValid: true,
        data: {
          appointmentId: appointmentData.appointmentId,
          insuredId: appointmentData.insuredId,
          countryISO: appointmentData.countryISO,
          scheduleId: appointmentData.scheduleId
        }
      };

    } catch (error) {
      return {
        isValid: false,
        reason: `parse_error: ${(error as Error).message}`
      };
    }
  }
}

/**
 * Country Appointment Handler - Presentation Layer
 * Receives dependencies from outside (Dependency Inversion Principle)
 */
export class CountryAppointmentHandler {
  constructor(
    private config: CountryHandlerConfig,
    private dependencies: CountryHandlerDependencies
  ) {}

  /**
   * Main handler method
   */
  async handle(event: SQSEvent, context: Context): Promise<void> {
    const requestId = context.awsRequestId;

    try {
      // Log lambda invocation
      console.log(`${this.config.countryCode} Lambda invoked`, {
        requestId,
        recordCount: event.Records.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const totalRecords = event.Records.length;

      this.dependencies.logger.info('Starting batch processing', {
        logId: this.config.logEvents.PROCESSING_STARTED.logId,
        requestId,
        totalRecords,
        targetCountry: this.config.countryCode
      });

      const results: ProcessingResult[] = [];
      let processed = 0;
      let failed = 0;
      let skipped = 0;

      for (const record of event.Records) {
        const result = await this.processRecord(record, requestId);
        results.push(result);

        if (result.success) processed++;
        else if (result.skipped) skipped++;
        else failed++;
      }

      const executionTime = Date.now() - startTime;

      this.dependencies.logger.info('Batch processing completed', {
        logId: this.config.logEvents.PROCESSED.logId,
        requestId,
        totalRecords,
        processed,
        failed,
        skipped,
        executionTime
      });

      // Handle partial failures
      if (failed > 0) {
        this.dependencies.logger.warn('Some records failed processing', {
          requestId,
          failedCount: failed,
          totalRecords
        });
      }

    } catch (error) {
      logInfrastructureError(this.dependencies.logger, error as Error, { 
        requestId, 
        operation: 'batch-processing' 
      });
      
      throw error;
    }
  }

  /**
   * Process individual record
   */
  private async processRecord(record: any, requestId: string): Promise<ProcessingResult> {
    const messageId = record.messageId;

    try {
      // Parse and validate message
      const parseResult = SQSMessageParser.parseAndValidate(record, this.config.countryCode);

      if (!parseResult.isValid) {
        this.dependencies.logger.info('Skipping message', {
          messageId,
          reason: parseResult.reason,
          country: parseResult.data?.countryISO,
          expected: this.config.countryCode
        });
        return { messageId, skipped: true, reason: parseResult.reason || 'unknown' };
      }

      // Create DTO
      const processDto: ProcessCountryAppointmentDto = {
        appointmentId: parseResult.data!.appointmentId,
        insuredId: parseResult.data!.insuredId,
        countryISO: parseResult.data!.countryISO,
        scheduleId: parseResult.data!.scheduleId
      };

      // Execute use case (dependency injected)
      await this.dependencies.processAppointmentUseCase.execute(processDto);

      this.dependencies.logger.info('Appointment processed successfully', {
        logId: this.config.logEvents.PROCESSED.logId,
        messageId,
        appointmentId: parseResult.data!.appointmentId,
        insuredId: maskInsuredId(parseResult.data!.insuredId),
        country: this.config.countryCode
      });

      return { messageId, success: true };

    } catch (error) {
      const err = error as Error;
      
      if (err.name === 'ValidationError') {
        logBusinessError(this.dependencies.logger, err, { messageId, requestId });
        return { 
          messageId, 
          success: false, 
          error: { type: 'validation', message: err.message }
        };
      }

      logInfrastructureError(this.dependencies.logger, err, { messageId, requestId });
      return { 
        messageId, 
        success: false, 
        error: { type: 'infrastructure', message: err.message }
      };
    }
  }
}
