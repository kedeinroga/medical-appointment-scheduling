export const APPOINTMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  PROCESSED: 'processed',
  SCHEDULED: 'scheduled'
} as const;

export const COUNTRY_ISO = {
  CHILE: 'CL',
  PERU: 'PE'
} as const;

export const INSURED_ID_LENGTH = 5;

export const SCHEDULE_ID_MIN_VALUE = 1;

export type AppointmentStatusType = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];
export type CountryISOType = typeof COUNTRY_ISO[keyof typeof COUNTRY_ISO];
