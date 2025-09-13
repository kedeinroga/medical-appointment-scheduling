import { APPOINTMENT_STATUS, AppointmentStatusType } from '../constants/appointment.constants';

export class AppointmentStatus {
  public static readonly COMPLETED = new AppointmentStatus(APPOINTMENT_STATUS.COMPLETED);
  public static readonly PENDING = new AppointmentStatus(APPOINTMENT_STATUS.PENDING);
  public static readonly PROCESSED = new AppointmentStatus(APPOINTMENT_STATUS.PROCESSED);
  public static readonly SCHEDULED = new AppointmentStatus(APPOINTMENT_STATUS.SCHEDULED);

  private constructor(private readonly value: AppointmentStatusType) {}

  public static fromString(value: string): AppointmentStatus {
    if (!value) {
      throw new Error('Appointment status cannot be empty');
    }

    const lowerValue = value.toLowerCase();
    
    switch (lowerValue) {
      case APPOINTMENT_STATUS.PENDING:
        return AppointmentStatus.PENDING;
      case APPOINTMENT_STATUS.PROCESSED:
        return AppointmentStatus.PROCESSED;
      case APPOINTMENT_STATUS.SCHEDULED:
        return AppointmentStatus.SCHEDULED;
      case APPOINTMENT_STATUS.COMPLETED:
        return AppointmentStatus.COMPLETED;
      default:
        throw new Error(`Invalid appointment status: ${value}`);
    }
  }

  public getValue(): AppointmentStatusType {
    return this.value;
  }

  public equals(other: AppointmentStatus): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public isCompleted(): boolean {
    return this.value === APPOINTMENT_STATUS.COMPLETED;
  }

  public isPending(): boolean {
    return this.value === APPOINTMENT_STATUS.PENDING;
  }

  public isProcessed(): boolean {
    return this.value === APPOINTMENT_STATUS.PROCESSED;
  }

  public isScheduled(): boolean {
    return this.value === APPOINTMENT_STATUS.SCHEDULED;
  }
}
