/**
 * Type definitions and contracts for Appointment CL Lambda Function
 * Defines interfaces, types and dependency contracts
 */

import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { ProcessAppointmentUseCase } from '@medical-appointment/core-use-cases';
import { IAppointmentRepository } from '@medical-appointment/core-domain';

/**
 * Lambda Handler Dependencies
 * All external dependencies needed by the handler
 */
export interface HandlerDependencies {
  // Use cases
  processAppointmentUseCase: ProcessAppointmentUseCase;
  
  // Infrastructure services
  appointmentRepository: IAppointmentRepository;
  
  // Utilities
  logger: Logger;
}

/**
 * Handler Configuration
 */
export interface HandlerConfig {
  targetCountry: 'CL';
  batchSize: number;
  maxRetries: number;
  processingTimeout: number;
}

/**
 * Processing Result for each record
 */
export interface ProcessingResult {
  messageId: string;
  success: boolean;
  appointmentId?: string;
  error?: {
    code: string;
    message: string;
    type: 'VALIDATION' | 'BUSINESS' | 'INFRASTRUCTURE';
  };
  skipped?: {
    reason: string;
    details?: string;
  };
}

/**
 * Batch Processing Summary
 */
export interface BatchProcessingSummary {
  totalRecords: number;
  processedSuccessfully: number;
  failed: number;
  skipped: number;
  results: ProcessingResult[];
  executionTime: number;
}

/**
 * Message Processing Context
 */
export interface MessageContext {
  messageId: string;
  receiptHandle: string;
  timestamp: string;
  requestId: string;
  country: 'CL';
}

/**
 * Parsed Message Data
 */
export interface ParsedMessageData {
  snsMessage: {
    messageId: string;
    type: string;
    timestamp: string;
    subject?: string;
  };
  appointmentPayload: {
    appointmentId: string;
    insuredId: string;
    countryISO: 'CL';
    scheduleId: number;
    status: string;
    createdAt: string;
    metadata?: {
      source: string;
      version: string;
    };
  };
}

/**
 * Error Types
 */
export type ValidationError = {
  type: 'VALIDATION';
  code: 'INVALID_MESSAGE_FORMAT' | 'INVALID_COUNTRY' | 'MISSING_REQUIRED_FIELDS';
  message: string;
  details?: Record<string, any>;
};

export type BusinessError = {
  type: 'BUSINESS';
  code: 'APPOINTMENT_NOT_FOUND' | 'INVALID_STATUS_TRANSITION' | 'PROCESSING_RULE_VIOLATION';
  message: string;
  details?: Record<string, any>;
};

export type InfrastructureError = {
  type: 'INFRASTRUCTURE';
  code: 'DATABASE_ERROR' | 'EVENT_PUBLISHING_ERROR' | 'EXTERNAL_SERVICE_ERROR';
  message: string;
  details?: Record<string, any>;
};

export type ProcessingError = ValidationError | BusinessError | InfrastructureError;

/**
 * Lambda Handler Type
 */
export type AppointmentCLHandler = (
  event: SQSEvent,
  context: Context,
  dependencies?: Partial<HandlerDependencies>
) => Promise<BatchProcessingSummary>;

/**
 * Constants
 */
export const HANDLER_CONSTANTS = {
  TARGET_COUNTRY: 'CL' as const,
  MAX_BATCH_SIZE: 10,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  LOG_EVENTS: {
    BATCH_PROCESSING_STARTED: 'cl-batch-processing-started',
    RECORD_PROCESSING_STARTED: 'cl-record-processing-started',
    RECORD_PROCESSING_COMPLETED: 'cl-record-processing-completed',
    RECORD_PROCESSING_FAILED: 'cl-record-processing-failed',
    RECORD_SKIPPED: 'cl-record-skipped',
    BATCH_PROCESSING_COMPLETED: 'cl-batch-processing-completed'
  }
} as const;
