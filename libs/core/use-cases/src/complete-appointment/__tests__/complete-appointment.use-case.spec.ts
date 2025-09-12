import { Appointment, AppointmentId, CountryISO, IAppointmentRepository, Insured, InsuredId, Schedule } from '@medical-appointment/core-domain';

import { CompleteAppointmentUseCase } from '../complete-appointment.use-case';
import { CompleteAppointmentDto } from '../complete-appointment.dto';
import { IEventBus } from '../../ports/event-bus.port';

describe(CompleteAppointmentUseCase.name, () => {
  let completeAppointmentUseCase: CompleteAppointmentUseCase;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockAppointmentRepository = {
      findByAppointmentId: jest.fn(),
      findByInsuredId: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    mockEventBus = {
      publish: jest.fn()
    };

    completeAppointmentUseCase = new CompleteAppointmentUseCase(
      mockAppointmentRepository,
      mockEventBus
    );
  });

  const createTestAppointment = (
    insuredIdValue: string = '12345',
    countryISO: CountryISO = CountryISO.PERU,
    scheduleId: number = 100,
    processed: boolean = true
  ): Appointment => {
    const insured = Insured.create({
      countryISO,
      insuredId: InsuredId.fromString(insuredIdValue)
    });

    const schedule = Schedule.create({
      centerId: 1,
      date: new Date('2025-12-01T10:00:00Z'),
      medicId: 1,
      scheduleId,
      specialtyId: 1
    });

    const appointment = Appointment.create({
      insured,
      schedule
    });

    if (processed) {
      appointment.markAsProcessed();
    }

    return appointment;
  };

  describe('execute', () => {
    it('should complete Peru appointment successfully', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, true);
      const appointmentId = appointment.getAppointmentId().getValue();

      const dto: CompleteAppointmentDto = {
        appointmentId,
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await completeAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(appointmentId);
      expect(result.countryISO).toBe('PE');
      expect(result.status).toBe('completed');
      expect(result.message).toBe('Appointment completed successfully for PE');

      expect(mockAppointmentRepository.findByAppointmentId).toHaveBeenCalledWith(
        expect.objectContaining({ value: appointmentId })
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should complete Chile appointment successfully', async () => {
      // Arrange
      const appointment = createTestAppointment('67890', CountryISO.CHILE, 200, true);
      const appointmentId = appointment.getAppointmentId().getValue();

      const dto: CompleteAppointmentDto = {
        appointmentId,
        countryISO: 'CL',
        insuredId: '67890',
        scheduleId: 200
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await completeAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(appointmentId);
      expect(result.countryISO).toBe('CL');
      expect(result.status).toBe('completed');
      expect(result.message).toBe('Appointment completed successfully for CL');
    });

    it('should throw error when appointment not found', async () => {
      // Arrange
      const dto: CompleteAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(null);

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Appointment with ID 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });

    it('should throw error when appointment is not processed', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, false); // Not processed

      const dto: CompleteAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow(
        'is not in processed status. Current status: pending'
      );
    });

    it('should throw error when appointment is already completed', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, true);
      appointment.markAsCompleted(); // Already completed

      const dto: CompleteAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow(
        'is not in processed status. Current status: completed'
      );
    });

    it('should throw error when country does not match', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, true);

      const dto: CompleteAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'CL', // Different from appointment country (PE)
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Appointment country PE does not match completion country CL'
      );
    });

    it('should throw error for invalid country ISO', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, true);

      const dto: CompleteAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'US', // Invalid country
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Unsupported country ISO: US'
      );
    });

    it('should handle repository update error', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, true);

      const dto: CompleteAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockRejectedValue(new Error('Database update failed'));

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow('Database update failed');
    });

    it('should handle event bus publish error', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100, true);

      const dto: CompleteAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus unavailable'));

      // Act & Assert
      await expect(completeAppointmentUseCase.execute(dto)).rejects.toThrow('Event bus unavailable');
    });
  });
});
