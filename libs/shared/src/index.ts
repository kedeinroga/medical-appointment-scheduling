// Core shared utilities
// This file serves as the main entry point for the shared utilities layer

// Utils
export * from './utils/pii-masking.util';
export * from './utils/api-gateway.util';
export * from './utils/logging.util';

// Decorators
export * from './decorators/singleton/singleton.decorators';

// Exceptions
export * from './exceptions/business.exceptions';

export const SHARED_LAYER_VERSION = '1.0.0';
