/**
 * Test constants following medical appointment scheduling conventions
 * Used across all test suites to ensure consistency and reduce hardcoded values
 */

export const TEST_DATA = {
  VALID_INSURED_IDS: ['12345', '00123', '99999', '67890', '54321'],
  INVALID_INSURED_IDS: ['123', '123456', 'abcde', '', '0000a'],
  VALID_COUNTRIES: ['PE', 'CL'],
  INVALID_COUNTRIES: ['US', 'BR', 'MX', 'AR'],
  VALID_SCHEDULE_IDS: [1, 100, 200, 999999],
  INVALID_SCHEDULE_IDS: [0, -1, -100],
  VALID_APPOINTMENT_IDS: [
    '550e8400-e29b-41d4-a716-446655440000',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
  ],
  INVALID_APPOINTMENT_IDS: [
    'invalid-uuid',
    '123',
    '',
    'not-a-uuid'
  ]
} as const;

export const TEST_APPOINTMENTS = {
  PERU_APPOINTMENT: {
    insuredId: '12345',
    scheduleId: 100,
    countryISO: 'PE'
  },
  CHILE_APPOINTMENT: {
    insuredId: '67890',
    scheduleId: 200,
    countryISO: 'CL'
  }
} as const;

export const TEST_SCHEDULES = {
  PERU_SCHEDULE: {
    centerId: 1,
    date: new Date('2025-12-01T10:00:00Z'),
    medicId: 1,
    scheduleId: 100,
    specialtyId: 1
  },
  CHILE_SCHEDULE: {
    centerId: 2,
    date: new Date('2025-12-02T14:00:00Z'),
    medicId: 2,
    scheduleId: 200,
    specialtyId: 2
  }
} as const;

export const TEST_DATES = {
  FUTURE_DATE: new Date('2025-12-15T10:00:00Z'),
  PAST_DATE: new Date('2023-01-01T10:00:00Z'),
  TODAY: new Date()
} as const;

export const TEST_PII = {
  VALID_PHONE_NUMBERS: ['987654321', '98765432', '1234567890'],
  INVALID_PHONE_NUMBERS: ['123', '', '12ab'],
  VALID_EMAILS: ['john.doe@example.com', 'test@domain.org', 'user@company.co'],
  INVALID_EMAILS: ['invalid-email', '', 'test@', '@domain.com']
} as const;
