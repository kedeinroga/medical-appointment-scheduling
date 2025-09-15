export interface CompleteAppointmentDto {
  appointmentId: string;
  countryISO: string;
  insuredId: string;
  scheduleId: number;
  status?: string; // Optional, used for validation in handler
}

export interface CompleteAppointmentResponseDto {
  appointmentId: string;
  countryISO: string;
  message: string;
  status: string;
}
