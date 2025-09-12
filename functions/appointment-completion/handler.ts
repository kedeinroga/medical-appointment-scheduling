// External dependencies (alphabetical, @ first)
import { Logger } from '@aws-lambda-powertools/logger';
import { SQSEvent, SQSHandler } from 'aws-lambda';

// Application layer
import { 
  CompleteAppointmentDto,
  CompleteAppointmentUseCase 
} from '@medical-appointment/core-use-cases';
import { ValidationError } from '@medical-appointment/shared';

// Infrastructure layer
import { UseCaseFactory } from '@medical-appointment/infrastructure';

// Same layer modules (alphabetical)
import { APPOINTMENT_STATUS, ERROR_CODES, LOG_EVENTS, REQUIRED_MESSAGE_FIELDS } from './constants';

// Initialize logger
const logger = new Logger({
  serviceName: 'medical-appointment-scheduling',
  logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
});

// Initialize dependencies for completion processing
const completeAppointmentUseCase = UseCaseFactory.createCompleteAppointmentUseCase();

/**
 * Mask insured ID to protect PII in logs
 */
const maskInsuredId = (insuredId: string): string => {
  if (!insuredId || insuredId.length !== 5) return '***';
  return `${insuredId.substring(0, 2)}***`;
};

/**
 * Parse EventBridge message from SQS record
 */
const parseEventBridgeMessage = (recordBody: string): any => {
  try {
    let messageBody = JSON.parse(recordBody);
    
    // If it's wrapped in an EventBridge envelope, extract the detail
    if (messageBody.detail && messageBody['detail-type']) {
      messageBody = messageBody.detail;
    }
    
    return messageBody;
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
 * Lambda handler for completing appointments
 * Triggered by SQS messages from EventBridge after PE/CL processing
 */
export const main: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const requestId = event.Records[0]?.messageId || 'unknown';
  
  logger.info(LOG_EVENTS.APPOINTMENT_COMPLETION_STARTED.message, {
    logId: LOG_EVENTS.APPOINTMENT_COMPLETION_STARTED.logId,
    requestId,
    recordCount: event.Records.length,
    eventSource: 'SQS'
  });

  for (const record of event.Records) {
    try {
      logger.info('Processing completion SQS record', {
        logId: 'completion-sqs-record-processing-started',
        messageId: record.messageId,
        receiptHandle: record.receiptHandle.substring(0, 20) + '...' // Truncate for security
      });

      // Parse the EventBridge message from SQS
      const messageBody = parseEventBridgeMessage(record.body);

      // Validate message structure
      validateMessageFields(messageBody);

      // Extract fields (alphabetical order)
      const { appointmentId, countryISO, insuredId, scheduleId, status } = messageBody;

      // Validate that the appointment was processed successfully
      if (status !== APPOINTMENT_STATUS.PROCESSED) {
        logger.warn(LOG_EVENTS.NON_PROCESSED_STATUS.message, {
          logId: LOG_EVENTS.NON_PROCESSED_STATUS.logId,
          messageId: record.messageId,
          appointmentId,
          currentStatus: status
        });
        continue; // Skip this message
      }

      // Create DTO for completion (alphabetical order)
      const completeDto: CompleteAppointmentDto = {
        appointmentId,
        countryISO,
        insuredId,
        scheduleId: Number(scheduleId)
      };

      logger.info('Completing appointment', {
        logId: 'appointment-completion-initiated',
        appointmentId,
        insuredId: maskInsuredId(insuredId),
        countryISO
      });

      // Initialize use case
      const completeAppointmentUseCase = UseCaseFactory.createCompleteAppointmentUseCase();

      // Execute the use case
      const result = await completeAppointmentUseCase.execute(completeDto);

      logger.info(LOG_EVENTS.APPOINTMENT_COMPLETED.message, {
        logId: LOG_EVENTS.APPOINTMENT_COMPLETED.logId,
        appointmentId,
        insuredId: maskInsuredId(insuredId),
        countryISO,
        status: result.status,
        success: true
      });

    } catch (error) {
      const errorInstance = error as Error;
      
      logger.error(LOG_EVENTS.APPOINTMENT_COMPLETION_ERROR.message, {
        logId: LOG_EVENTS.APPOINTMENT_COMPLETION_ERROR.logId,
        messageId: record.messageId,
        errorType: errorInstance.constructor.name,
        errorMessage: errorInstance.message,
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

  logger.info('Appointment completion processing finished', {
    logId: 'completion-processing-finished',
    processedRecords: event.Records.length
  });
};
