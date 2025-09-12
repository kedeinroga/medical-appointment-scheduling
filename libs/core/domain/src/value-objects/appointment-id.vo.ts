import { v4 as uuidv4 } from 'uuid';

export class AppointmentId {
  private constructor(private readonly value: string) {}

  public static create(): AppointmentId {
    return new AppointmentId(uuidv4());
  }

  public static fromString(value: string): AppointmentId {
    if (!value || value.trim().length === 0) {
      throw new Error('Appointment ID cannot be empty');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('Invalid appointment ID format');
    }
    
    return new AppointmentId(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: AppointmentId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
