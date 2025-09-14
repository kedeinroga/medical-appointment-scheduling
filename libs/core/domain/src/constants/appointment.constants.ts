// DynamoDB appointment statuses
export const DYNAMODB_APPOINTMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed'
} as const;

// MySQL appointment statuses (PE/CL specific)
export const MYSQL_APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const;

// Legacy - mantener para compatibilidad hacia atrás
export const APPOINTMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  PROCESSED: 'processed', // Deprecated
  SCHEDULED: 'scheduled'
} as const;

export const COUNTRY_ISO = {
  CHILE: 'CL',
  PERU: 'PE'
} as const;

export const INSURED_ID_LENGTH = 5;

export const SCHEDULE_ID_MIN_VALUE = 1;

export type DynamoDBAppointmentStatusType = typeof DYNAMODB_APPOINTMENT_STATUS[keyof typeof DYNAMODB_APPOINTMENT_STATUS];
export type MySQLAppointmentStatusType = typeof MYSQL_APPOINTMENT_STATUS[keyof typeof MYSQL_APPOINTMENT_STATUS];
export type AppointmentStatusType = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS]; // Legacy
export type CountryISOType = typeof COUNTRY_ISO[keyof typeof COUNTRY_ISO];
