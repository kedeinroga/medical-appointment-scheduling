export interface CreateAppointmentDto {
  countryISO: string;
  insuredId: string;
  scheduleId: number;
}

export interface CreateAppointmentResponseDto {
  appointmentId: string;
  message: string;
  status: string;
}
