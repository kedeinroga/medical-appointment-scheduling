/**
 * Validation schemas for Appointment PE Lambda Function
 * Defines input validation and data structure contracts
 */

import { z } from 'zod';

/**
 * SQS Record schema validation
 */
export const SQSRecordSchema = z.object({
  body: z.string().min(1, 'SQS record body cannot be empty'),
  messageId: z.string().min(1, 'Message ID is required'),
  receiptHandle: z.string().min(1, 'Receipt handle is required')
});

/**
 * SNS Message schema validation (within SQS body)
 */
export const SNSMessageSchema = z.object({
  Type: z.literal('Notification'),
  MessageId: z.string().min(1, 'SNS Message ID is required'),
  Message: z.string().min(1, 'SNS Message content is required'),
  Subject: z.string().optional(),
  Timestamp: z.string().min(1, 'Timestamp is required')
});

/**
 * Appointment payload schema (within SNS Message)
 */
export const AppointmentPayloadSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  insuredId: z.string().regex(/^\d{5}$/, 'Insured ID must be exactly 5 digits'),
  countryISO: z.literal('PE'),
  scheduleId: z.number().int().positive('Schedule ID must be a positive integer'),
  status: z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'COMPLETED', 'FAILED']),
  createdAt: z.string().datetime('Invalid datetime format for createdAt'),
  metadata: z.object({
    source: z.string().min(1, 'Source is required'),
    version: z.string().min(1, 'Version is required')
  }).optional()
});

/**
 * Complete SQS event validation
 */
export const SQSEventSchema = z.object({
  Records: z.array(SQSRecordSchema).min(1, 'At least one SQS record is required')
});

/**
 * Validation helper functions
 */
export const validateSQSEvent = (event: unknown) => {
  return SQSEventSchema.parse(event);
};

export const validateSNSMessage = (messageBody: string) => {
  const parsedBody = JSON.parse(messageBody);
  return SNSMessageSchema.parse(parsedBody);
};

export const validateAppointmentPayload = (messageContent: string) => {
  const parsedMessage = JSON.parse(messageContent);
  return AppointmentPayloadSchema.parse(parsedMessage);
};

/**
 * Type inference from schemas
 */
export type SQSRecord = z.infer<typeof SQSRecordSchema>;
export type SNSMessage = z.infer<typeof SNSMessageSchema>;
export type AppointmentPayload = z.infer<typeof AppointmentPayloadSchema>;
export type SQSEventType = z.infer<typeof SQSEventSchema>;
