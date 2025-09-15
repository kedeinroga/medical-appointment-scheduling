import { Schedule } from '../entities/schedule.entity';
import { CountryISO } from '../value-objects/country-iso.vo';

export interface IScheduleRepository {
  findByScheduleId(scheduleId: number, countryISO: CountryISO): Promise<Schedule>;
  findAvailableSchedules(countryISO: CountryISO, date?: Date): Promise<Schedule[]>;
  save(schedule: Schedule, countryISO: CountryISO): Promise<void>;
  markAsReserved(scheduleId: number, countryISO: CountryISO): Promise<void>;
}
