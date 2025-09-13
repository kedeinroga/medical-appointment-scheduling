import { 
  Appointment, 
  AppointmentProcessedEvent, 
  CountryISO,
  IAppointmentRepository,
  IEventBus,
  IScheduleRepository,
  Insured,
  InsuredId
} from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';
import { maskInsuredId } from '@medical-appointment/shared';

import { ProcessCountryAppointmentDto, ProcessCountryAppointmentResponseDto } from './process-country-appointment.dto';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'process-country-appointment-use-case'
});

export class ProcessCountryAppointmentUseCase {
  constructor(
    private readonly countryAppointmentRepository: IAppointmentRepository,
    private readonly eventBus: IEventBus,
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(dto: ProcessCountryAppointmentDto): Promise<ProcessCountryAppointmentResponseDto> {
    logger.info('Processing country appointment', {
      appointmentId: dto.appointmentId,
      countryISO: dto.countryISO,
      insuredId: maskInsuredId(dto.insuredId)
    });

    try {
      // Create value objects with validation
      const insuredId = InsuredId.fromString(dto.insuredId);
      const countryISO = CountryISO.fromString(dto.countryISO);

      // Get schedule from repository
      const schedule = await this.scheduleRepository.findByScheduleId(dto.scheduleId, countryISO);
      if (!schedule) {
        throw new Error(`Schedule with ID ${dto.scheduleId} not found for country ${dto.countryISO}`);
      }

      // Create insured entity
      const insured = Insured.create({
        countryISO,
        insuredId
      });

      // Create appointment entity for MySQL storage (country-specific)
      const countryAppointment = Appointment.fromPrimitives({
        appointmentId: dto.appointmentId,
        insuredId: dto.insuredId,
        countryISO: dto.countryISO,
        schedule: {
          scheduleId: dto.scheduleId,
          centerId: schedule.getCenterId(),
          specialtyId: schedule.getSpecialtyId(),
          medicId: schedule.getMedicId(),
          date: schedule.getDate()
        },
        status: 'processed',
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: new Date()
      });

      // Process country-specific logic
      await this.processCountrySpecificLogic(countryAppointment, countryISO);

      // Save appointment to MySQL (country-specific table)
      await this.countryAppointmentRepository.save(countryAppointment);

      // Reserve the schedule slot
      await this.scheduleRepository.markAsReserved(dto.scheduleId, countryISO);

      // Create and publish domain event to EventBridge for completion
      const appointmentProcessedEvent = new AppointmentProcessedEvent(
        dto.appointmentId,
        dto.countryISO,
        dto.insuredId,
        new Date(),
        dto.scheduleId
      );

      await this.eventBus.publish(appointmentProcessedEvent);

      logger.info('Country appointment processed successfully', {
        appointmentId: dto.appointmentId,
        countryISO: dto.countryISO,
        maskedInsuredId: maskInsuredId(dto.insuredId),
        processedAt: new Date().toISOString()
      });

      return {
        appointmentId: dto.appointmentId,
        countryISO: dto.countryISO,
        message: `Appointment processed successfully for ${dto.countryISO}`,
        status: 'processed'
      } as ProcessCountryAppointmentResponseDto;
    } catch (error) {
      logger.error('Failed to process country appointment', {
        appointmentId: dto.appointmentId,
        countryISO: dto.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error',
        insuredId: maskInsuredId(dto.insuredId)
      });
      throw error;
    }
  }

  private async processCountrySpecificLogic(countryAppointment: any, countryISO: CountryISO): Promise<void> {
    // This method implements country-specific business logic
    // In a real implementation, this would contain different logic for PE vs CL
    
    if (countryISO.isPeru()) {
      await this.processPeruAppointment(countryAppointment);
    } else if (countryISO.isChile()) {
      await this.processChileAppointment(countryAppointment);
    }
  }

  private async processPeruAppointment(countryAppointment: any): Promise<void> {
    // Peru-specific processing logic
    logger.info('Processing appointment for Peru', {
      appointmentId: countryAppointment.getAppointmentId().getValue()
    });
    
    // Simulate Peru-specific business rules
    // e.g., validate with RENIEC, check insurance status, etc.
    await this.simulateExternalValidation('Peru');
  }

  private async processChileAppointment(countryAppointment: any): Promise<void> {
    // Chile-specific processing logic
    logger.info('Processing appointment for Chile', {
      appointmentId: countryAppointment.getAppointmentId().getValue()
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
