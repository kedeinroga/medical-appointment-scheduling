import { 
  Appointment, 
  AppointmentCreatedEvent, 
  AppointmentId, 
  CountryISO, 
  IAppointmentRepository, 
  IScheduleRepository, 
  Insured, 
  InsuredId 
} from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';

import { IEventBus } from '../ports/event-bus.port';
import { CreateAppointmentDto, CreateAppointmentResponseDto } from './create-appointment.dto';
import { maskInsuredId } from '../utils/pii-masking.util';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'medical-appointment-scheduling'
});

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly eventBus: IEventBus,
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
      if (!schedule) {
        throw new Error(`Schedule with ID ${dto.scheduleId} not found for country ${dto.countryISO}`);
      }

      // Create appointment entity
      const appointment = Appointment.create({
        insured,
        schedule
      });

      // Save to repository
      await this.appointmentRepository.save(appointment);

      // Create and publish domain event
      const appointmentCreatedEvent = new AppointmentCreatedEvent(
        appointment.getAppointmentId().getValue(),
        appointment.getCountryISO().getValue(),
        appointment.getInsuredId().getValue(),
        appointment.getScheduleId()
      );

      await this.eventBus.publish(appointmentCreatedEvent);

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
