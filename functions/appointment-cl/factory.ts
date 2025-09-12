/**
 * Dependency Factory for Appointment CL Lambda Function
 * Creates and configures all dependencies following Clean Architecture
 */

import { Logger } from '@aws-lambda-powertools/logger';
import { ProcessAppointmentUseCase } from '@medical-appointment/core-use-cases';
import { UseCaseFactory } from '@medical-appointment/infrastructure';
import { HandlerDependencies, HandlerConfig, HANDLER_CONSTANTS } from './definitions';

/**
 * Factory class for creating handler dependencies
 * Implements dependency injection pattern
 */
export class DependencyFactory {
  private static instance: DependencyFactory;
  private dependencies: HandlerDependencies | null = null;

  private constructor() {}

  /**
   * Singleton pattern for dependency factory
   */
  public static getInstance(): DependencyFactory {
    if (!DependencyFactory.instance) {
      DependencyFactory.instance = new DependencyFactory();
    }
    return DependencyFactory.instance;
  }

  /**
   * Create all dependencies for the handler
   * Infrastructure -> Use Cases -> Handler
   */
  public createDependencies(): HandlerDependencies {
    if (this.dependencies) {
      return this.dependencies;
    }

    // Step 1: Initialize logger
    const logger = new Logger({
      serviceName: 'medical-appointment-cl-processor',
      logLevel: (process.env.LOG_LEVEL as any) || 'INFO',
      environment: process.env.ENVIRONMENT || 'development'
    });

    // Step 2: Create infrastructure layer dependencies (repositories, adapters)
    const appointmentRepository = UseCaseFactory.getAppointmentRepository();

    // Step 3: Create use cases with injected dependencies
    const processAppointmentUseCase = UseCaseFactory.createProcessAppointmentUseCase();

    // Step 4: Assemble all dependencies
    this.dependencies = {
      processAppointmentUseCase,
      appointmentRepository,
      logger
    };

    return this.dependencies;
  }

  /**
   * Create handler configuration
   */
  public createConfig(): HandlerConfig {
    return {
      targetCountry: HANDLER_CONSTANTS.TARGET_COUNTRY,
      batchSize: parseInt(process.env.BATCH_SIZE || String(HANDLER_CONSTANTS.MAX_BATCH_SIZE)),
      maxRetries: parseInt(process.env.MAX_RETRIES || String(HANDLER_CONSTANTS.MAX_RETRIES)),
      processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT || String(HANDLER_CONSTANTS.DEFAULT_TIMEOUT))
    };
  }

  /**
   * Create test dependencies (for unit testing)
   */
  public createTestDependencies(overrides: Partial<HandlerDependencies> = {}): HandlerDependencies {
    const defaultDependencies = this.createDependencies();
    
    return {
      ...defaultDependencies,
      ...overrides
    };
  }

  /**
   * Reset dependencies (useful for testing)
   */
  public reset(): void {
    this.dependencies = null;
  }
}

/**
 * Convenience function to get configured dependencies
 */
export const createHandlerDependencies = (): HandlerDependencies => {
  return DependencyFactory.getInstance().createDependencies();
};

/**
 * Convenience function to get handler configuration
 */
export const createHandlerConfig = (): HandlerConfig => {
  return DependencyFactory.getInstance().createConfig();
};
