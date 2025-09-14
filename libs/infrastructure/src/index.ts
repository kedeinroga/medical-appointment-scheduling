// Infrastructure layer exports
// This file serves as the main entry point for the infrastructure layer

// Adapters - Repositories
export * from './adapters/repositories/dynamodb-appointment.repository';
export * from './adapters/repositories/mysql-appointment.repository';
export * from './adapters/repositories/mysql-schedule.repository';

// Adapters - Messaging
export * from './adapters/messaging/eventbridge.adapter';
export * from './adapters/messaging/sns.adapter';
export * from './adapters/messaging/sqs.adapter';

// Configuration
export * from './config/aws.config';
export * from './config/database.config';
export * from './config/environment.config';

// Factories
export * from './factories/adapter.factory';
export * from './factories/country-processing.factory';

// Errors
export * from './errors/aws.errors';

export const INFRASTRUCTURE_LAYER_VERSION = '1.0.0';
