import { IScheduleRepository, Schedule, CountryISO } from '@medical-appointment/core-domain';

/**
 * Mock implementation of MySQLScheduleRepository for testing
 * Prevents real database connections during tests
 */
export class MySQLScheduleRepository implements IScheduleRepository {
  constructor() {
    // Mock constructor - no real database connection
  }

  async findByScheduleId(scheduleId: number, countryISO: CountryISO): Promise<Schedule | null> {
    // Mock implementation - return null for tests
    return Promise.resolve(null);
  }

  async findAvailableSchedules(countryISO: CountryISO, date?: Date): Promise<Schedule[]> {
    // Mock implementation - return empty array for tests
    return Promise.resolve([]);
  }

  async save(schedule: Schedule, countryISO: CountryISO): Promise<void> {
    // Mock implementation - no actual database operation
    return Promise.resolve();
  }

  async markAsReserved(scheduleId: number, countryISO: CountryISO): Promise<void> {
    // Mock implementation - no actual database operation
    return Promise.resolve();
  }

  async closeConnection(): Promise<void> {
    // Mock implementation - no actual connection to close
    return Promise.resolve();
  }
}
