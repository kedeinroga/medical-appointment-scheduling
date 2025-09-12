import { AppointmentCompletedEvent, AppointmentId, CountryISO, IAppointmentRepository } from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';

import { IEventBus } from '../ports/event-bus.port';
import { CompleteAppointmentDto, CompleteAppointmentResponseDto } from './complete-appointment.dto';
import { maskInsuredId } from '../utils/pii-masking.util';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'medical-appointment-scheduling'
});

export class CompleteAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(dto: CompleteAppointmentDto): Promise<CompleteAppointmentResponseDto> {
    logger.info('Completing appointment', {
      appointmentId: dto.appointmentId,
      countryISO: dto.countryISO,
      insuredId: maskInsuredId(dto.insuredId)
    });

    try {
      // Validate and get appointment
      const appointmentId = AppointmentId.fromString(dto.appointmentId);
      const appointment = await this.appointmentRepository.findByAppointmentId(appointmentId);
      
      if (!appointment) {
        throw new Error(`Appointment with ID ${dto.appointmentId} not found`);
      }

      // Validate appointment is in processed status
      if (!appointment.isProcessed()) {
        throw new Error(`Appointment ${dto.appointmentId} is not in processed status. Current status: ${appointment.getStatus().getValue()}`);
      }

      // Validate country matches
      const countryISO = CountryISO.fromString(dto.countryISO);
      if (!appointment.getCountryISO().equals(countryISO)) {
        throw new Error(`Appointment country ${appointment.getCountryISO().getValue()} does not match completion country ${dto.countryISO}`);
      }

      // Mark appointment as completed
      appointment.markAsCompleted();

      // Update appointment in repository
      await this.appointmentRepository.update(appointment);

      // Create and publish domain event
      const appointmentCompletedEvent = new AppointmentCompletedEvent(
        appointment.getAppointmentId().getValue(),
        new Date(), // completedAt - current time
        appointment.getCountryISO().getValue(),
        appointment.getInsuredId().getValue(),
        appointment.getScheduleId()
      );

      await this.eventBus.publish(appointmentCompletedEvent);

      logger.info('Appointment completed successfully', {
        appointmentId: dto.appointmentId,
        countryISO: dto.countryISO,
        insuredId: maskInsuredId(dto.insuredId)
      });

      return {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: appointment.getCountryISO().getValue(),
        message: `Appointment completed successfully for ${dto.countryISO}`,
        status: appointment.getStatus().getValue()
      };
    } catch (error) {
      logger.error('Failed to complete appointment', {
        appointmentId: dto.appointmentId,
        countryISO: dto.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error',
        insuredId: maskInsuredId(dto.insuredId)
      });
      throw error;
    }
  }
}
