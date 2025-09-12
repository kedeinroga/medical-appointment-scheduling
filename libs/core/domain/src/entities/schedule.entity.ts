import { SCHEDULE_ID_MIN_VALUE } from '../constants/appointment.constants';

export class Schedule {
  private constructor(
    private readonly centerId: number,
    private readonly date: Date,
    private readonly medicId: number,
    private readonly scheduleId: number,
    private readonly specialtyId: number
  ) {}

  public static create(data: {
    centerId: number;
    date: Date;
    medicId: number;
    scheduleId: number;
    specialtyId: number;
  }): Schedule {
    Schedule.validateScheduleId(data.scheduleId);
    Schedule.validateCenterId(data.centerId);
    Schedule.validateSpecialtyId(data.specialtyId);
    Schedule.validateMedicId(data.medicId);
    Schedule.validateDate(data.date);

    return new Schedule(
      data.centerId,
      data.date,
      data.medicId,
      data.scheduleId,
      data.specialtyId
    );
  }

  private static validateScheduleId(scheduleId: number): void {
    if (!Number.isInteger(scheduleId) || scheduleId < SCHEDULE_ID_MIN_VALUE) {
      throw new Error(`Schedule ID must be a positive integer starting from ${SCHEDULE_ID_MIN_VALUE}`);
    }
  }

  private static validateCenterId(centerId: number): void {
    if (!Number.isInteger(centerId) || centerId < 1) {
      throw new Error('Center ID must be a positive integer');
    }
  }

  private static validateSpecialtyId(specialtyId: number): void {
    if (!Number.isInteger(specialtyId) || specialtyId < 1) {
      throw new Error('Specialty ID must be a positive integer');
    }
  }

  private static validateMedicId(medicId: number): void {
    if (!Number.isInteger(medicId) || medicId < 1) {
      throw new Error('Medic ID must be a positive integer');
    }
  }

  private static validateDate(date: Date): void {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Date must be a valid Date object');
    }

    const now = new Date();
    if (date < now) {
      throw new Error('Schedule date cannot be in the past');
    }
  }

  public getCenterId(): number {
    return this.centerId;
  }

  public getDate(): Date {
    return new Date(this.date);
  }

  public getMedicId(): number {
    return this.medicId;
  }

  public getScheduleId(): number {
    return this.scheduleId;
  }

  public getSpecialtyId(): number {
    return this.specialtyId;
  }

  public equals(other: Schedule): boolean {
    return this.scheduleId === other.scheduleId;
  }

  public toJSON(): {
    centerId: number;
    date: string;
    medicId: number;
    scheduleId: number;
    specialtyId: number;
  } {
    return {
      centerId: this.centerId,
      date: this.date.toISOString(),
      medicId: this.medicId,
      scheduleId: this.scheduleId,
      specialtyId: this.specialtyId
    };
  }
}
