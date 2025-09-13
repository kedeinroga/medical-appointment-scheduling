export interface ProcessCountryAppointmentDto {
  appointmentId: string;
  insuredId: string;
  countryISO: string;
  scheduleId: number;
}

export interface ProcessCountryAppointmentResponseDto {
  appointmentId: string;
  countryISO: string;
  message: string;
  status: string;
}
