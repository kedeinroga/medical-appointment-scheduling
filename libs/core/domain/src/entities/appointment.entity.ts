import { AppointmentId } from '../value-objects/appointment-id.vo';
import { AppointmentStatus } from '../value-objects/appointment-status.vo';
import { CountryISO } from '../value-objects/country-iso.vo';
import { InsuredId } from '../value-objects/insured-id.vo';
import { Insured } from './insured.entity';
import { Schedule } from './schedule.entity';

export class Appointment {
  private constructor(
    private readonly appointmentId: AppointmentId,
    private readonly createdAt: Date,
    private readonly insured: Insured,
    private processedAt: Date | null,
    private readonly schedule: Schedule,
    private status: AppointmentStatus,
    private updatedAt: Date
  ) {}

  public static create(data: {
    insured: Insured;
    schedule: Schedule;
  }): Appointment {
    const now = new Date();
    
    return new Appointment(
      AppointmentId.create(),
      now,
      data.insured,
      null,
      data.schedule,
      AppointmentStatus.PENDING,
      now
    );
  }

  public static fromPrimitives(data: {
    appointmentId: string;
    countryISO: string;
    createdAt: Date;
    insuredId: string;
    processedAt?: Date | null;
    schedule: {
      centerId: number;
      date: Date;
      medicId: number;
      scheduleId: number;
      specialtyId: number;
    };
    status: string;
    updatedAt: Date;
  }): Appointment {
    const appointmentId = AppointmentId.fromString(data.appointmentId);
    const status = AppointmentStatus.fromString(data.status);
    const insured = Insured.fromPrimitives({
      countryISO: data.countryISO,
      insuredId: data.insuredId
    });
    const schedule = Schedule.create(data.schedule);

    return new Appointment(
      appointmentId,
      data.createdAt,
      insured,
      data.processedAt || null,
      schedule,
      status,
      data.updatedAt
    );
  }

  public markAsProcessed(): void {
    if (!this.status.isPending()) {
      throw new Error('Only pending appointments can be marked as processed');
    }

    this.status = AppointmentStatus.PROCESSED;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  public markAsCompleted(): void {
    if (!this.status.isPending()) {
      throw new Error('Only pending appointments can be marked as completed');
    }

    this.status = AppointmentStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  public getAppointmentId(): AppointmentId {
    return this.appointmentId;
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public getInsured(): Insured {
    return this.insured;
  }

  public getInsuredId(): InsuredId {
    return this.insured.getInsuredId();
  }

  public getCountryISO(): CountryISO {
    return this.insured.getCountryISO();
  }

  public getProcessedAt(): Date | null {
    return this.processedAt ? new Date(this.processedAt) : null;
  }

  public getSchedule(): Schedule {
    return this.schedule;
  }

  public getScheduleId(): number {
    return this.schedule.getScheduleId();
  }

  public getStatus(): AppointmentStatus {
    return this.status;
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  public isCompleted(): boolean {
    return this.status.isCompleted();
  }

  public isPending(): boolean {
    return this.status.isPending();
  }

  public isProcessed(): boolean {
    return this.status.isProcessed();
  }

  public equals(other: Appointment): boolean {
    return this.appointmentId.equals(other.appointmentId);
  }

  public toJSON(): {
    appointmentId: string;
    countryISO: string;
    createdAt: string;
    insuredId: string;
    processedAt: string | null;
    schedule: {
      centerId: number;
      date: string;
      medicId: number;
      scheduleId: number;
      specialtyId: number;
    };
    status: string;
    updatedAt: string;
  } {
    return {
      appointmentId: this.appointmentId.getValue(),
      countryISO: this.insured.getCountryISO().getValue(),
      createdAt: this.createdAt.toISOString(),
      insuredId: this.insured.getInsuredId().getValue(),
      processedAt: this.processedAt ? this.processedAt.toISOString() : null,
      schedule: this.schedule.toJSON(),
      status: this.status.getValue(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  public toLogSafeJSON(): {
    appointmentId: string;
    countryISO: string;
    createdAt: string;
    insuredId: string;
    processedAt: string | null;
    scheduleId: number;
    status: string;
    updatedAt: string;
  } {
    return {
      appointmentId: this.appointmentId.getValue(),
      countryISO: this.insured.getCountryISO().getValue(),
      createdAt: this.createdAt.toISOString(),
      insuredId: this.insured.getInsuredId().getMaskedValue(),
      processedAt: this.processedAt ? this.processedAt.toISOString() : null,
      scheduleId: this.schedule.getScheduleId(),
      status: this.status.getValue(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}
