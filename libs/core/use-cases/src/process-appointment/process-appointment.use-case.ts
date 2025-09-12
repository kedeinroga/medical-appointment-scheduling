import { AppointmentId, AppointmentProcessedEvent, CountryISO, IAppointmentRepository, IScheduleRepository } from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';

import { IEventBus } from '../ports/event-bus.port';
import { ProcessAppointmentDto, ProcessAppointmentResponseDto } from './process-appointment.dto';
import { maskInsuredId } from '../utils/pii-masking.util';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'medical-appointment-scheduling'
});

export class ProcessAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly eventBus: IEventBus,
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(dto: ProcessAppointmentDto): Promise<ProcessAppointmentResponseDto> {
    logger.info('Processing appointment', {
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

      // Validate appointment is in pending status
      if (!appointment.isPending()) {
        throw new Error(`Appointment ${dto.appointmentId} is not in pending status`);
      }

      // Validate country matches
      const countryISO = CountryISO.fromString(dto.countryISO);
      if (!appointment.getCountryISO().equals(countryISO)) {
        throw new Error(`Appointment country ${appointment.getCountryISO().getValue()} does not match processing country ${dto.countryISO}`);
      }

      // Process country-specific logic
      await this.processCountrySpecificLogic(appointment, countryISO);

      // Mark appointment as processed
      appointment.markAsProcessed();

      // Update appointment in repository
      await this.appointmentRepository.update(appointment);

      // Reserve the schedule slot
      await this.scheduleRepository.markAsReserved(dto.scheduleId, countryISO);

      // Create and publish domain event
      const appointmentProcessedEvent = new AppointmentProcessedEvent(
        appointment.getAppointmentId().getValue(),
        appointment.getCountryISO().getValue(),
        appointment.getInsuredId().getValue(),
        appointment.getProcessedAt()!,
        appointment.getScheduleId()
      );

      await this.eventBus.publish(appointmentProcessedEvent);

      logger.info('Appointment processed successfully', {
        appointmentId: appointmentId.getValue(),
        countryISO: dto.countryISO,
        maskedInsuredId: maskInsuredId(dto.insuredId),
        processedAt: new Date().toISOString()
      });

      return {
        appointmentId: appointmentId.getValue(),
        countryISO: dto.countryISO,
        message: `Appointment processed successfully for ${dto.countryISO}`,
        status: 'processed'
      } as ProcessAppointmentResponseDto;
    } catch (error) {
      logger.error('Failed to process appointment', {
        appointmentId: dto.appointmentId,
        countryISO: dto.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error',
        insuredId: maskInsuredId(dto.insuredId)
      });
      throw error;
    }
  }

  private async processCountrySpecificLogic(appointment: any, countryISO: CountryISO): Promise<void> {
    // This method implements country-specific business logic
    // In a real implementation, this would contain different logic for PE vs CL
    
    if (countryISO.isPeru()) {
      await this.processPeruAppointment(appointment);
    } else if (countryISO.isChile()) {
      await this.processChileAppointment(appointment);
    }
  }

  private async processPeruAppointment(appointment: any): Promise<void> {
    // Peru-specific processing logic
    logger.info('Processing appointment for Peru', {
      appointmentId: appointment.getAppointmentId().getValue()
    });
    
    // Simulate Peru-specific business rules
    // e.g., validate with RENIEC, check insurance status, etc.
    await this.simulateExternalValidation('Peru');
  }

  private async processChileAppointment(appointment: any): Promise<void> {
    // Chile-specific processing logic
    logger.info('Processing appointment for Chile', {
      appointmentId: appointment.getAppointmentId().getValue()
    });
    
    // Simulate Chile-specific business rules
    // e.g., validate with RUT, check FONASA/ISAPRE, etc.
    await this.simulateExternalValidation('Chile');
  }

  private async simulateExternalValidation(country: string): Promise<void> {
    // Simulate external API call validation
    // In real implementation, this would call external services
    logger.debug(`Simulating external validation for ${country}`);
    
    // Add artificial delay to simulate network call
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
