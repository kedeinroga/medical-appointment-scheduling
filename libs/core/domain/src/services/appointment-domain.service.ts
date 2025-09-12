import { Appointment } from '../entities/appointment.entity';
import { Insured } from '../entities/insured.entity';
import { Schedule } from '../entities/schedule.entity';
import { AppointmentCreatedEvent } from '../events/appointment-created.event';
import { AppointmentProcessedEvent } from '../events/appointment-processed.event';
import { AppointmentCompletedEvent } from '../events/appointment-completed.event';
import { DomainEvent } from '../events/domain.event';

export class AppointmentDomainService {
  public createAppointment(
    insured: Insured,
    schedule: Schedule
  ): { appointment: Appointment; events: DomainEvent[] } {
    const appointment = Appointment.create({
      insured,
      schedule
    });

    const event = new AppointmentCreatedEvent(
      appointment.getAppointmentId().getValue(),
      appointment.getCountryISO().getValue(),
      appointment.getInsuredId().getValue(),
      appointment.getScheduleId()
    );

    return {
      appointment,
      events: [event]
    };
  }

  public processAppointment(
    appointment: Appointment
  ): { appointment: Appointment; events: DomainEvent[] } {
    appointment.markAsProcessed();

    const event = new AppointmentProcessedEvent(
      appointment.getAppointmentId().getValue(),
      appointment.getCountryISO().getValue(),
      appointment.getInsuredId().getValue(),
      appointment.getProcessedAt()!,
      appointment.getScheduleId()
    );

    return {
      appointment,
      events: [event]
    };
  }

  public completeAppointment(
    appointment: Appointment
  ): { appointment: Appointment; events: DomainEvent[] } {
    appointment.markAsCompleted();

    const event = new AppointmentCompletedEvent(
      appointment.getAppointmentId().getValue(),
      appointment.getUpdatedAt(),
      appointment.getCountryISO().getValue(),
      appointment.getInsuredId().getValue(),
      appointment.getScheduleId()
    );

    return {
      appointment,
      events: [event]
    };
  }

  public validateAppointmentCreation(insured: Insured, schedule: Schedule): void {
    // Business rule: Schedule date must be in the future
    const now = new Date();
    if (schedule.getDate() <= now) {
      throw new Error('Cannot create appointment for past dates');
    }

    // Business rule: Validate country-specific constraints
    if (insured.getCountryISO().isPeru()) {
      this.validatePeruSpecificRules(schedule);
    } else if (insured.getCountryISO().isChile()) {
      this.validateChileSpecificRules(schedule);
    }
  }

  private validatePeruSpecificRules(schedule: Schedule): void {
    // Peru-specific business rules can be added here
    // For now, just basic validation
    const scheduleDate = schedule.getDate();
    const dayOfWeek = scheduleDate.getDay();
    
    // Example: No appointments on Sundays in Peru
    if (dayOfWeek === 0) {
      throw new Error('No appointments allowed on Sundays in Peru');
    }
  }

  private validateChileSpecificRules(schedule: Schedule): void {
    // Chile-specific business rules can be added here
    // For now, just basic validation
    const scheduleDate = schedule.getDate();
    const hour = scheduleDate.getHours();
    
    // Example: Appointments only during business hours in Chile
    if (hour < 8 || hour > 17) {
      throw new Error('Appointments in Chile are only allowed between 8 AM and 5 PM');
    }
  }
}
