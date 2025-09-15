import { IAppointmentRepository, InsuredId } from '@medical-appointment/core-domain';
import { Logger } from '@aws-lambda-powertools/logger';
import { maskInsuredId } from '@medical-appointment/shared';

import { AppointmentSummaryDto, GetAppointmentsDto, GetAppointmentsResponseDto } from './get-appointments.dto';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'medical-appointment-scheduling'
});

export class GetAppointmentsByInsuredIdUseCase {
  constructor(
    private readonly dynamoDbRepository: IAppointmentRepository,
    private readonly mysqlRepository: IAppointmentRepository
  ) {}

  async execute(dto: GetAppointmentsDto): Promise<GetAppointmentsResponseDto> {
    logger.info('Getting appointments by insured ID', {
      insuredId: maskInsuredId(dto.insuredId)
    });

    try {
      // Validate insured ID - this will throw if invalid
      const insuredId = InsuredId.fromString(dto.insuredId);

      // Get appointments from both repositories in parallel
      const [dynamoAppointments, mysqlAppointments] = await Promise.all([
        this.dynamoDbRepository.findByInsuredId(insuredId).catch(error => {
          logger.warn('Failed to get appointments from DynamoDB', {
            error: error.message,
            insuredId: maskInsuredId(dto.insuredId)
          });
          return [];
        }),
        this.mysqlRepository.findByInsuredId(insuredId).catch(error => {
          logger.warn('Failed to get appointments from MySQL', {
            error: error.message,
            insuredId: maskInsuredId(dto.insuredId)
          });
          return [];
        })
      ]);

      // Combine appointments from both sources
      const allAppointments = [...dynamoAppointments, ...mysqlAppointments];

      // Remove duplicates based on appointmentId and keep the most recent version
      const uniqueAppointments = this.removeDuplicateAppointments(allAppointments);

      // Sort by creation date (most recent first)
      uniqueAppointments.sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());

      // Transform to DTOs
      const appointmentDtos: AppointmentSummaryDto[] = uniqueAppointments.map(appointment => {
        const schedule = appointment.getSchedule();
        return {
          appointmentId: appointment.getAppointmentId().getValue(),
          countryISO: appointment.getCountryISO().getValue(),
          createdAt: appointment.getCreatedAt().toISOString(),
          insuredId: appointment.getInsuredId().getValue(),
          processedAt: appointment.getProcessedAt()?.toISOString() || null,
          schedule: schedule ? {
            scheduleId: schedule.getScheduleId(),
            centerId: schedule.getCenterId(),
            date: schedule.getDate().toISOString(),
            medicId: schedule.getMedicId(),
            specialtyId: schedule.getSpecialtyId()
          } : undefined,
          status: appointment.getStatus().getValue(),
          updatedAt: appointment.getUpdatedAt().toISOString()
        };
      });

      logger.info('Appointments retrieved successfully', {
        appointmentsCount: appointmentDtos.length,
        dynamoCount: dynamoAppointments.length,
        insuredId: maskInsuredId(dto.insuredId),
        mysqlCount: mysqlAppointments.length,
        totalUniqueCount: uniqueAppointments.length
      });

      return {
        appointments: appointmentDtos
      };
    } catch (error) {
      logger.error('Failed to get appointments', {
        error: error instanceof Error ? error.message : 'Unknown error',
        insuredId: maskInsuredId(dto.insuredId)
      });
      throw error;
    }
  }

  private removeDuplicateAppointments(appointments: any[]): any[] {
    const appointmentMap = new Map();

    appointments.forEach(appointment => {
      const id = appointment.getAppointmentId().getValue();
      const existing = appointmentMap.get(id);

      if (!existing || appointment.getUpdatedAt().getTime() > existing.getUpdatedAt().getTime()) {
        appointmentMap.set(id, appointment);
      }
    });

    return Array.from(appointmentMap.values());
  }
}
