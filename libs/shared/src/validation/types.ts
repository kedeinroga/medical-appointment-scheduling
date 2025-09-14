/**
 * Validation Types - Type definitions for validation framework
 */

export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: ValidationErrorDetails[];
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  code: string;
}

export interface ValidationOptions {
  stripUnknown?: boolean;
  allowUnknown?: boolean;
  abortEarly?: boolean;
}

/**
 * HTTP validation context
 */
export interface HTTPValidationContext {
  method: string;
  path: string;
  headers: Record<string, string>;
  requestId: string;
}

/**
 * Validation modes for different input sources
 */
export type ValidationMode = 'body' | 'query' | 'path' | 'headers';
