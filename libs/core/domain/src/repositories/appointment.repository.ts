import { Appointment } from '../entities/appointment.entity';
import { AppointmentId } from '../value-objects/appointment-id.vo';
import { InsuredId } from '../value-objects/insured-id.vo';

export interface IAppointmentRepository {
  findByAppointmentId(appointmentId: AppointmentId): Promise<Appointment>;
  findByInsuredId(insuredId: InsuredId): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
}
