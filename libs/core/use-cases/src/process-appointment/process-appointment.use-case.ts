import { 
  Appointment, 
  AppointmentCreatedEvent,
  AppointmentId, 
  CountryISO,
  IAppointmentRepository, 
  IEventBus,
  IScheduleRepository,
  Insured,
  InsuredId
} from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';
import { maskInsuredId } from '@medical-appointment/shared';

import { ProcessAppointmentDto, ProcessAppointmentResponseDto } from './process-appointment.dto';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'process-appointment-use-case'
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
      // Create value objects with validation
      const insuredId = InsuredId.fromString(dto.insuredId);
      const countryISO = CountryISO.fromString(dto.countryISO);
      const appointmentId = AppointmentId.fromString(dto.appointmentId);

      // Get schedule from repository to validate it exists
      const schedule = await this.scheduleRepository.findByScheduleId(dto.scheduleId, countryISO);
      if (!schedule) {
        throw new Error(`Schedule with ID ${dto.scheduleId} not found for country ${dto.countryISO}`);
      }

      // Create insured entity
      const insured = Insured.create({
        countryISO,
        insuredId
      });

      // Create appointment entity for DynamoDB storage with pending status
      const appointment = Appointment.fromPrimitives({
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
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save appointment to DynamoDB with pending status
      await this.appointmentRepository.save(appointment);

      // Publish to SNS for country processing (PE/CL lambdas)
      // The event bus will route to the appropriate country SNS topic
      const appointmentCreatedEvent = new AppointmentCreatedEvent(
        dto.appointmentId,
        dto.countryISO,
        dto.insuredId,
        dto.scheduleId
      );

      await this.eventBus.publish(appointmentCreatedEvent);

      logger.info('Appointment processed and sent to country processing', {
        appointmentId: appointmentId.getValue(),
        countryISO: dto.countryISO,
        maskedInsuredId: maskInsuredId(dto.insuredId),
        status: 'pending'
      });

      return {
        appointmentId: appointmentId.getValue(),
        countryISO: dto.countryISO,
        message: `Appointment created and sent for processing to ${dto.countryISO}`,
        status: 'pending'
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
}
