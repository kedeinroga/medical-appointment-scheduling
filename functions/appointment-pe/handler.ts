/**
 * Appointment PE Lambda Handler - Clean Architecture Compliant
 * Functions/Presentation Layer - Only contains configuration and wiring
 */

// External dependencies
import { SQSEvent, SQSHandler, Context } from 'aws-lambda';

// Shared handler from Functions layer
import { CountryHandlerFactory } from '../shared/country-handler.factory';
import { CountryHandlerConfig } from '../shared/country-appointment-handler';

// Handler layer imports (same layer)
import { LOG_EVENTS } from './constants';

/**
 * Configuration for Peru appointments
 * This is pure configuration - no business logic
 */
const PERU_HANDLER_CONFIG: CountryHandlerConfig = {
  countryCode: 'PE',
  serviceName: 'medical-appointment-pe-processor',
  logEvents: {
    PROCESSING_STARTED: LOG_EVENTS.PE_APPOINTMENT_PROCESSING_STARTED,
    PROCESSED: LOG_EVENTS.PE_APPOINTMENT_PROCESSED
  }
};

/**
 * Main Lambda Handler - Clean Architecture compliant
 * - No business logic here
 * - Only configuration and dependency injection through factory
 * - Factory handles the infrastructure bridge properly
 */
export const main: SQSHandler = CountryHandlerFactory.createLambdaHandler(PERU_HANDLER_CONFIG);
