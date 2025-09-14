// Core shared utilities
// This file serves as the main entry point for the shared utilities layer

// Utils
export * from './utils/pii-masking.util';
export * from './utils/api-gateway.util';
export * from './utils/logging.util';

// Constants (with specific exports to avoid conflicts)
export { 
  SUPPORTED_COUNTRIES, 
  INSURED_ID_LENGTH, 
  INSURED_ID_PATTERN,
  COMMON_ERROR_CODES,
  HTTP_STATUS_CODES,
  type SupportedCountry 
} from './constants/medical-appointment.constants';

// Validation (with specific exports to avoid conflicts)
export * from './validation/types';
export * from './validation/dto-schemas';
export * from './validation/validators';
export * from './validation/validation-middleware';

// Decorators
export * from './decorators/singleton/singleton.decorators';

// Exceptions
export * from './exceptions/business.exceptions';

export const SHARED_LAYER_VERSION = '1.0.0';
