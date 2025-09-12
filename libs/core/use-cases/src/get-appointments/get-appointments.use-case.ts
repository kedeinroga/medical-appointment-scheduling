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
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  async execute(dto: GetAppointmentsDto): Promise<GetAppointmentsResponseDto> {
    logger.info('Getting appointments by insured ID', {
      insuredId: maskInsuredId(dto.insuredId)
    });

    try {
      // Validate insured ID - this will throw if invalid
      const insuredId = InsuredId.fromString(dto.insuredId);

      // Get appointments from repository
      const appointments = await this.appointmentRepository.findByInsuredId(insuredId);

      // Transform to DTOs - appointments could be empty array but not undefined
      const appointmentDtos: AppointmentSummaryDto[] = appointments.map(appointment => ({
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: appointment.getCountryISO().getValue(),
        createdAt: appointment.getCreatedAt().toISOString(),
        insuredId: appointment.getInsuredId().getValue(),
        processedAt: appointment.getProcessedAt()?.toISOString() || null,
        scheduleId: appointment.getScheduleId(),
        status: appointment.getStatus().getValue(),
        updatedAt: appointment.getUpdatedAt().toISOString()
      }));

      logger.info('Appointments retrieved successfully', {
        appointmentsCount: appointmentDtos.length,
        insuredId: maskInsuredId(dto.insuredId)
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
}
