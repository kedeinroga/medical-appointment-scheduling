export interface ProcessAppointmentDto {
  appointmentId: string;
  countryISO: string;
  insuredId: string;
  scheduleId: number;
}

export interface ProcessAppointmentResponseDto {
  appointmentId: string;
  countryISO: string;
  message: string;
  status: string;
}
