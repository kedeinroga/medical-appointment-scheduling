/**
 * Country Handler Factory - Functions/Presentation Layer
 * This factory creates handlers with proper dependency injection
 * Following Clean Architecture principles
 */

import { Logger } from '@aws-lambda-powertools/logger';

// Application layer  
import { CountryProcessingCompositionFactory } from '@medical-appointment/core-use-cases';

// Infrastructure layer
import { CountryProcessingFactory } from '@medical-appointment/infrastructure';

// Domain layer
import { CountryISO } from '@medical-appointment/core-domain';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

// Shared handler
import { 
  CountryAppointmentHandler, 
  CountryHandlerConfig, 
  CountryHandlerDependencies 
} from './country-appointment-handler';

/**
 * Factory for creating country-specific handlers
 * This is part of the Functions/Presentation layer
 * Uses @Singleton decorator for efficient handler creation
 */
@Singleton
export class CountryHandlerFactory {
  
  /**
   * Creates a handler with all dependencies properly injected
   * This method handles the infrastructure bridge properly
   */
  static createHandler(config: CountryHandlerConfig): CountryAppointmentHandler {
    // Create logger
    const logger = new Logger({
      serviceName: config.serviceName,
      logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
    });

    // Create use case through Composition Root pattern
    const countryISO = CountryISO.fromString(config.countryCode);
    const countryAdapters = CountryProcessingFactory.createCountryProcessingAdapters(countryISO);

    const processAppointmentUseCase = CountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase(
      countryAdapters.appointmentRepository,
      countryAdapters.eventBridgeAdapter,
      countryAdapters.scheduleRepository,
      countryISO
    );

    // Create dependencies object
    const dependencies: CountryHandlerDependencies = {
      processAppointmentUseCase,
      logger
    };

    // Return configured handler
    return new CountryAppointmentHandler(config, dependencies);
  }

  /**
   * Creates a Lambda handler function for the specific country
   */
  static createLambdaHandler(config: CountryHandlerConfig) {
    const handler = this.createHandler(config);
    
    return async (event: any, context: any) => {
      return handler.handle(event, context);
    };
  }
}
