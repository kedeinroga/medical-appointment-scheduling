/**
 * Test factories for creating test objects following Clean Architecture patterns
 * Provides consistent test data creation across all test suites
 */

import { CountryISO, Schedule } from '@medical-appointment/core-domain';
import { CreateAppointmentDto } from '../create-appointment/create-appointment.dto';
import { GetAppointmentsDto } from '../get-appointments/get-appointments.dto';
import { ProcessAppointmentDto } from '../process-appointment/process-appointment.dto';
import { CompleteAppointmentDto } from '../complete-appointment/complete-appointment.dto';
import { TEST_DATA, TEST_SCHEDULES, TEST_APPOINTMENTS } from './test.constants';

export class AppointmentTestFactory {
  /**
   * Creates a valid CreateAppointmentDto with optional overrides
   */
  static createValidDto(overrides?: Partial<CreateAppointmentDto>): CreateAppointmentDto {
    return {
      insuredId: TEST_DATA.VALID_INSURED_IDS[0],
      scheduleId: TEST_DATA.VALID_SCHEDULE_IDS[1], // 100
      countryISO: TEST_DATA.VALID_COUNTRIES[0], // PE
      ...overrides
    };
  }

  /**
   * Creates a Peru-specific CreateAppointmentDto
   */
  static createPeruDto(overrides?: Partial<CreateAppointmentDto>): CreateAppointmentDto {
    return {
      ...TEST_APPOINTMENTS.PERU_APPOINTMENT,
      ...overrides
    };
  }

  /**
   * Creates a Chile-specific CreateAppointmentDto
   */
  static createChileDto(overrides?: Partial<CreateAppointmentDto>): CreateAppointmentDto {
    return {
      ...TEST_APPOINTMENTS.CHILE_APPOINTMENT,
      ...overrides
    };
  }

  /**
   * Creates a GetAppointmentsDto
   */
  static createGetAppointmentsDto(overrides?: Partial<GetAppointmentsDto>): GetAppointmentsDto {
    return {
      insuredId: TEST_DATA.VALID_INSURED_IDS[0],
      ...overrides
    };
  }

  /**
   * Creates a ProcessAppointmentDto
   */
  static createProcessDto(overrides?: Partial<ProcessAppointmentDto>): ProcessAppointmentDto {
    return {
      appointmentId: TEST_DATA.VALID_APPOINTMENT_IDS[0],
      countryISO: TEST_DATA.VALID_COUNTRIES[0],
      insuredId: TEST_DATA.VALID_INSURED_IDS[0],
      scheduleId: TEST_DATA.VALID_SCHEDULE_IDS[1],
      ...overrides
    };
  }

  /**
   * Creates a CompleteAppointmentDto
   */
  static createCompleteDto(overrides?: Partial<CompleteAppointmentDto>): CompleteAppointmentDto {
    return {
      appointmentId: TEST_DATA.VALID_APPOINTMENT_IDS[0],
      countryISO: TEST_DATA.VALID_COUNTRIES[0],
      insuredId: TEST_DATA.VALID_INSURED_IDS[0],
      scheduleId: TEST_DATA.VALID_SCHEDULE_IDS[1],
      ...overrides
    };
  }
}

export class ScheduleTestFactory {
  /**
   * Creates a Peru schedule entity
   */
  static createPeruSchedule(overrides?: any): Schedule {
    return Schedule.create({
      ...TEST_SCHEDULES.PERU_SCHEDULE,
      ...overrides
    });
  }

  /**
   * Creates a Chile schedule entity
   */
  static createChileSchedule(overrides?: any): Schedule {
    return Schedule.create({
      ...TEST_SCHEDULES.CHILE_SCHEDULE,
      ...overrides
    });
  }

  /**
   * Creates a generic valid schedule
   */
  static createValidSchedule(overrides?: any): Schedule {
    return Schedule.create({
      centerId: 1,
      date: new Date('2025-12-01T10:00:00Z'),
      medicId: 1,
      scheduleId: TEST_DATA.VALID_SCHEDULE_IDS[1],
      specialtyId: 1,
      ...overrides
    });
  }
}

export class MockFactory {
  /**
   * Creates a complete mock for IAppointmentRepository
   */
  static createAppointmentRepositoryMock() {
    return {
      findByAppointmentId: jest.fn(),
      findByInsuredId: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };
  }

  /**
   * Creates a complete mock for IScheduleRepository
   */
  static createScheduleRepositoryMock() {
    return {
      findAvailableSchedules: jest.fn(),
      findByScheduleId: jest.fn(),
      markAsReserved: jest.fn(),
      save: jest.fn()
    };
  }

  /**
   * Creates a complete mock for IEventBus
   */
  static createEventBusMock() {
    return {
      publish: jest.fn()
    };
  }
}
