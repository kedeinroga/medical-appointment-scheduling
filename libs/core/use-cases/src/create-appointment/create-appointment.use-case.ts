import { 
  Appointment, 
  CountryISO, 
  IAppointmentRepository, 
  IMessagingPort,
  IScheduleRepository, 
  Insured, 
  InsuredId 
} from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';
import { maskInsuredId } from '@medical-appointment/shared';

import { CreateAppointmentDto, CreateAppointmentResponseDto } from './create-appointment.dto';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'medical-appointment-scheduling'
});

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly messagingPort: IMessagingPort,
    private readonly scheduleRepository: IScheduleRepository
  ) {}

  async execute(dto: CreateAppointmentDto): Promise<CreateAppointmentResponseDto> {
    logger.info('Creating appointment', {
      countryISO: dto.countryISO,
      hasScheduleId: !!dto.scheduleId,
      insuredId: maskInsuredId(dto.insuredId)
    });

    try {
      // Create value objects with validation
      const insuredId = InsuredId.fromString(dto.insuredId);
      const countryISO = CountryISO.fromString(dto.countryISO);

      // Create insured entity
      const insured = Insured.create({
        countryISO,
        insuredId
      });

      // Get schedule from repository
      const schedule = await this.scheduleRepository.findByScheduleId(dto.scheduleId, countryISO);

      // Create appointment entity
      const appointment = Appointment.create({
        insured,
        schedule
      });

      // Save to repository
      await this.appointmentRepository.save(appointment);

      // Publish to country-specific topic using the more appropriate method
      await this.messagingPort.publishToCountrySpecificTopic(
        {
          appointmentId: appointment.getAppointmentId().getValue(),
          countryISO: appointment.getCountryISO().getValue(),
          eventType: 'AppointmentCreated',
          insuredId: appointment.getInsuredId().getValue(),
          scheduleId: appointment.getScheduleId(),
          timestamp: new Date().toISOString()
        },
        countryISO,
        'AppointmentCreated'
      );

      logger.info('Appointment created successfully', {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: dto.countryISO,
        insuredId: maskInsuredId(dto.insuredId)
      });

      return {
        appointmentId: appointment.getAppointmentId().getValue(),
        message: 'Appointment scheduling is in process',
        status: appointment.getStatus().getValue()
      };
    } catch (error) {
      logger.error('Failed to create appointment', {
        countryISO: dto.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error',
        insuredId: maskInsuredId(dto.insuredId)
      });
      throw error;
    }
  }
}
