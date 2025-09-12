import { CountryISO } from '../value-objects/country-iso.vo';
import { InsuredId } from '../value-objects/insured-id.vo';

export class Insured {
  private constructor(
    private readonly countryISO: CountryISO,
    private readonly insuredId: InsuredId
  ) {}

  public static create(data: {
    countryISO: CountryISO;
    insuredId: InsuredId;
  }): Insured {
    return new Insured(data.countryISO, data.insuredId);
  }

  public static fromPrimitives(data: {
    countryISO: string;
    insuredId: string;
  }): Insured {
    const countryISO = CountryISO.fromString(data.countryISO);
    const insuredId = InsuredId.fromString(data.insuredId);

    return new Insured(countryISO, insuredId);
  }

  public getCountryISO(): CountryISO {
    return this.countryISO;
  }

  public getInsuredId(): InsuredId {
    return this.insuredId;
  }

  public equals(other: Insured): boolean {
    return (
      this.insuredId.equals(other.insuredId) &&
      this.countryISO.equals(other.countryISO)
    );
  }

  public toJSON(): {
    countryISO: string;
    insuredId: string;
  } {
    return {
      countryISO: this.countryISO.getValue(),
      insuredId: this.insuredId.getValue()
    };
  }

  public toLogSafeJSON(): {
    countryISO: string;
    insuredId: string;
  } {
    return {
      countryISO: this.countryISO.getValue(),
      insuredId: this.insuredId.getMaskedValue()
    };
  }
}
