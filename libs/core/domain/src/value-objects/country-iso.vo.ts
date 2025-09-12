import { COUNTRY_ISO, CountryISOType } from '../constants/appointment.constants';

export class CountryISO {
  public static readonly CHILE = new CountryISO(COUNTRY_ISO.CHILE);
  public static readonly PERU = new CountryISO(COUNTRY_ISO.PERU);

  private constructor(private readonly value: CountryISOType) {}

  public static fromString(value: string): CountryISO {
    if (!value) {
      throw new Error('Country ISO cannot be empty');
    }

    const upperValue = value.toUpperCase();
    
    switch (upperValue) {
      case COUNTRY_ISO.PERU:
        return CountryISO.PERU;
      case COUNTRY_ISO.CHILE:
        return CountryISO.CHILE;
      default:
        throw new Error(`Unsupported country ISO: ${value}. Only PE and CL are supported`);
    }
  }

  public getValue(): CountryISOType {
    return this.value;
  }

  public equals(other: CountryISO): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public isPeru(): boolean {
    return this.value === COUNTRY_ISO.PERU;
  }

  public isChile(): boolean {
    return this.value === COUNTRY_ISO.CHILE;
  }
}
