export interface CompleteAppointmentDto {
  appointmentId: string;
  countryISO: string;
  insuredId: string;
  scheduleId: number;
}

export interface CompleteAppointmentResponseDto {
  appointmentId: string;
  countryISO: string;
  message: string;
  status: string;
}
