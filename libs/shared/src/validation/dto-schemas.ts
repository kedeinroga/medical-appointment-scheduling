/**
 * DTO Schemas - Zod validation schemas for all API inputs
 * These schemas define the contract for HTTP API requests
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
export const CommonPatterns = {
  insuredId: z.string()
    .regex(/^\d{5}$/, 'Insured ID must be exactly 5 digits')
    .describe('5-digit insured person identifier'),
  
  countryISO: z.enum(['PE', 'CL'])
    .describe('Country ISO code (PE for Peru, CL for Chile)'),
  
  scheduleId: z.number()
    .int('Schedule ID must be an integer')
    .positive('Schedule ID must be positive')
    .describe('Unique schedule identifier'),
  
  appointmentId: z.string()
    .uuid('Appointment ID must be a valid UUID')
    .describe('Unique appointment identifier'),
  
  uuid: z.string()
    .uuid('Must be a valid UUID'),
  
  positiveInt: z.number()
    .int('Must be an integer')
    .positive('Must be positive'),
  
  date: z.string()
    .datetime('Must be a valid ISO datetime string')
    .describe('ISO 8601 datetime string'),

  status: z.enum(['pending', 'scheduled', 'completed', 'failed'])
    .describe('Appointment status')
} as const;

/**
 * CREATE APPOINTMENT SCHEMAS
 */
export const CreateAppointmentBodySchema = z.object({
  countryISO: CommonPatterns.countryISO,
  insuredId: z.string()
    .min(1, 'Insured ID is required')
    .transform(val => val.padStart(5, '0'))
    .pipe(CommonPatterns.insuredId),
  scheduleId: CommonPatterns.scheduleId
}).strict();

export type CreateAppointmentBody = z.infer<typeof CreateAppointmentBodySchema>;

/**
 * GET APPOINTMENTS SCHEMAS
 */
export const GetAppointmentsPathSchema = z.object({
  insuredId: z.string()
    .min(1, 'Insured ID is required')
    .transform(val => val.padStart(5, '0'))
    .pipe(CommonPatterns.insuredId)
}).strict();

export const GetAppointmentsQuerySchema = z.object({
  status: CommonPatterns.status.optional(),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.coerce.number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
  startDate: z.string()
    .datetime('Start date must be a valid ISO datetime')
    .optional()
    .describe('Filter appointments from this date'),
  endDate: z.string()
    .datetime('End date must be a valid ISO datetime')
    .optional()
    .describe('Filter appointments until this date')
}).strict();

export type GetAppointmentsPath = z.infer<typeof GetAppointmentsPathSchema>;
export type GetAppointmentsQuery = z.infer<typeof GetAppointmentsQuerySchema>;

/**
 * COMPLETE APPOINTMENT SCHEMAS  
 */
export const CompleteAppointmentPathSchema = z.object({
  appointmentId: CommonPatterns.appointmentId
}).strict();

export const CompleteAppointmentBodySchema = z.object({
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  outcome: z.enum(['successful', 'cancelled', 'no_show'])
    .describe('Appointment completion outcome')
}).strict();

export type CompleteAppointmentPath = z.infer<typeof CompleteAppointmentPathSchema>;
export type CompleteAppointmentBody = z.infer<typeof CompleteAppointmentBodySchema>;

/**
 * GENERIC HTTP SCHEMAS
 */
export const HTTPHeadersSchema = z.object({
  'content-type': z.string().optional(),
  'authorization': z.string().optional(),
  'x-correlation-id': z.string().uuid().optional(),
  'user-agent': z.string().optional()
}).passthrough(); // Allow additional headers

export type HTTPHeaders = z.infer<typeof HTTPHeadersSchema>;

/**
 * ERROR RESPONSE SCHEMA
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    errorCode: z.string(),
    field: z.string().optional(),
    details: z.record(z.any()).optional()
  })
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * PAGINATION SCHEMA
 */
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  total: z.number().int().min(0).optional()
});

export type Pagination = z.infer<typeof PaginationSchema>;
