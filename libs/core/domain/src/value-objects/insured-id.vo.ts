import { INSURED_ID_LENGTH } from '../constants/appointment.constants';

export class InsuredId {
  private constructor(private readonly value: string) {}

  public static fromString(value: string): InsuredId {
    if (!value) {
      throw new Error('Insured ID cannot be empty');
    }

    // Remove any non-digit characters and pad with zeros if necessary
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length === 0) {
      throw new Error('Insured ID must contain at least one digit');
    }
    
    if (cleanValue.length > INSURED_ID_LENGTH) {
      throw new Error(`Insured ID cannot be longer than ${INSURED_ID_LENGTH} digits`);
    }

    // Pad with leading zeros to ensure exactly 5 digits
    const paddedValue = cleanValue.padStart(INSURED_ID_LENGTH, '0');
    
    return new InsuredId(paddedValue);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: InsuredId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public getMaskedValue(): string {
    return `${this.value.substring(0, 2)}***`;
  }
}
