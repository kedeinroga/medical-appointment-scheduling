// External dependencies (alphabetical, @ first)
import { Logger } from '@aws-lambda-powertools/logger';
import { SQSEvent, SQSHandler } from 'aws-lambda';

// Application layer
import { 
  ProcessAppointmentDto,
  ProcessAppointmentUseCase 
} from '@medical-appointment/core-use-cases';
import { ValidationError } from '@medical-appointment/shared';

// Infrastructure layer
import { UseCaseFactory } from '@medical-appointment/infrastructure';

// Same layer modules (alphabetical)
import { COUNTRY_PROCESSING, ERROR_CODES, LOG_EVENTS, REQUIRED_MESSAGE_FIELDS } from './constants';

// Initialize logger
const logger = new Logger({
  serviceName: 'medical-appointment-scheduling',
  logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
});

/**
 * Mask insured ID to protect PII in logs
 */
const maskInsuredId = (insuredId: string): string => {
  if (!insuredId || insuredId.length !== 5) return '***';
  return `${insuredId.substring(0, 2)}***`;
};

/**
 * Parse SNS message from SQS record
 */
const parseSNSMessage = (recordBody: string): any => {
  try {
    const snsMessage = JSON.parse(recordBody);
    return JSON.parse(snsMessage.Message);
  } catch (parseError) {
    throw new ValidationError('messageBody', ERROR_CODES.INVALID_JSON_FORMAT);
  }
};

/**
 * Validate required fields in message
 */
const validateMessageFields = (messageBody: any): void => {
  const missingFields = REQUIRED_MESSAGE_FIELDS.filter(field => !messageBody[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      'messageFields', 
      `Missing required fields in message: ${missingFields.join(', ')}`
    );
  }
};

/**
 * Lambda handler for processing appointments in Chile (CL)
 * Triggered by SQS messages from SNS topic
 */
export const main: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const requestId = event.Records[0]?.messageId || 'unknown';
  
  logger.info(LOG_EVENTS.CL_APPOINTMENT_PROCESSING_STARTED.message, {
    logId: LOG_EVENTS.CL_APPOINTMENT_PROCESSING_STARTED.logId,
    requestId,
    recordCount: event.Records.length,
    eventSource: 'SQS',
    country: COUNTRY_PROCESSING.CHILE
  });

  for (const record of event.Records) {
    try {
      logger.info('Processing SQS record for CL', {
        logId: 'sqs-record-processing-started',
        messageId: record.messageId,
        receiptHandle: record.receiptHandle.substring(0, 20) + '...', // Truncate for security
        country: COUNTRY_PROCESSING.CHILE
      });

      // Parse the SNS message from SQS
      const messageBody = parseSNSMessage(record.body);

      // Validate message structure
      validateMessageFields(messageBody);

      // Extract fields (alphabetical order)
      const { appointmentId, countryISO, insuredId, scheduleId } = messageBody;

      // Verify this is for Chile
      if (countryISO !== COUNTRY_PROCESSING.EXPECTED_COUNTRY) {
        logger.warn(LOG_EVENTS.WRONG_COUNTRY_MESSAGE.message, {
          logId: LOG_EVENTS.WRONG_COUNTRY_MESSAGE.logId,
          messageId: record.messageId,
          expectedCountry: COUNTRY_PROCESSING.EXPECTED_COUNTRY,
          actualCountry: countryISO
        });
        continue; // Skip this message
      }

      // Create DTO for processing (alphabetical order)
      const processDto: ProcessAppointmentDto = {
        appointmentId,
        countryISO: COUNTRY_PROCESSING.CHILE as 'CL',
        insuredId,
        scheduleId: Number(scheduleId)
      };

      logger.info('Processing appointment for CL', {
        logId: 'appointment-processing-initiated',
        appointmentId,
        insuredId: maskInsuredId(insuredId),
        scheduleId,
        country: COUNTRY_PROCESSING.CHILE
      });

      // Initialize use case
      const processAppointmentUseCase = UseCaseFactory.createProcessAppointmentUseCase();

      // Execute the use case - Chile specific logic will be handled inside the use case
      const result = await processAppointmentUseCase.execute(processDto);

      logger.info(LOG_EVENTS.CL_APPOINTMENT_PROCESSED.message, {
        logId: LOG_EVENTS.CL_APPOINTMENT_PROCESSED.logId,
        appointmentId,
        insuredId: maskInsuredId(insuredId),
        scheduleId,
        country: COUNTRY_PROCESSING.CHILE,
        status: result.status,
        success: true
      });

    } catch (error) {
      const errorInstance = error as Error;
      
      logger.error(LOG_EVENTS.CL_APPOINTMENT_PROCESSING_ERROR.message, {
        logId: LOG_EVENTS.CL_APPOINTMENT_PROCESSING_ERROR.logId,
        messageId: record.messageId,
        errorType: errorInstance.constructor.name,
        errorMessage: errorInstance.message,
        country: COUNTRY_PROCESSING.CHILE,
        success: false
      });

      // For production, you might want to send failed messages to a DLQ
      // or implement retry logic. For now, we'll continue processing other messages
      if (error instanceof ValidationError) {
        logger.error('Validation error, skipping message', {
          logId: 'validation-error-skip',
          messageId: record.messageId,
          errorMessage: errorInstance.message
        });
        continue;
      }

      // For other errors, you might want to throw to trigger SQS retry mechanism
      throw error;
    }
  }

  logger.info('CL appointment processing completed', {
    logId: 'cl-processing-completed',
    processedRecords: event.Records.length,
    country: COUNTRY_PROCESSING.CHILE
  });
};
