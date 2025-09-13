export interface GetAppointmentsDto {
  insuredId: string;
}

export interface AppointmentSummaryDto {
  appointmentId: string;
  countryISO: string;
  createdAt: string;
  insuredId: string;
  processedAt?: string | null;
  scheduleId: number;
  status: string;
  updatedAt: string;
  schedule?: {
    centerId?: number;
    specialtyId?: number;
    medicId?: number;
    date?: string;
  } | undefined;
}

export interface GetAppointmentsResponseDto {
  appointments: AppointmentSummaryDto[];
}
