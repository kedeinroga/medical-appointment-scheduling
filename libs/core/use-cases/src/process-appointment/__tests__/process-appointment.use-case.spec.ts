import { Appointment, AppointmentId, CountryISO, IAppointmentRepository, IScheduleRepository, Insured, InsuredId, Schedule } from '@medical-appointment/core-domain';

import { ProcessAppointmentUseCase } from '../process-appointment.use-case';
import { ProcessAppointmentDto } from '../process-appointment.dto';
import { IEventBus } from '../../ports/event-bus.port';

describe(ProcessAppointmentUseCase.name, () => {
  let processAppointmentUseCase: ProcessAppointmentUseCase;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockScheduleRepository: jest.Mocked<IScheduleRepository>;

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

    mockScheduleRepository = {
      findAvailableSchedules: jest.fn(),
      findByScheduleId: jest.fn(),
      markAsReserved: jest.fn(),
      save: jest.fn()
    };

    processAppointmentUseCase = new ProcessAppointmentUseCase(
      mockAppointmentRepository,
      mockEventBus,
      mockScheduleRepository
    );
  });

  const createTestAppointment = (
    insuredIdValue: string = '12345',
    countryISO: CountryISO = CountryISO.PERU,
    scheduleId: number = 100
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

    return Appointment.create({
      insured,
      schedule
    });
  };

  describe('execute', () => {
    it('should process Peru appointment successfully', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100);
      const appointmentId = appointment.getAppointmentId().getValue();

      const dto: ProcessAppointmentDto = {
        appointmentId,
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await processAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(appointmentId);
      expect(result.countryISO).toBe('PE');
      expect(result.status).toBe('processed');
      expect(result.message).toBe('Appointment processed successfully for PE');

      expect(mockAppointmentRepository.findByAppointmentId).toHaveBeenCalledWith(
        expect.objectContaining({ value: appointmentId })
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledTimes(1);
      expect(mockScheduleRepository.markAsReserved).toHaveBeenCalledWith(100, CountryISO.PERU);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should process Chile appointment successfully', async () => {
      // Arrange
      const appointment = createTestAppointment('67890', CountryISO.CHILE, 200);
      const appointmentId = appointment.getAppointmentId().getValue();

      const dto: ProcessAppointmentDto = {
        appointmentId,
        countryISO: 'CL',
        insuredId: '67890',
        scheduleId: 200
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await processAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(appointmentId);
      expect(result.countryISO).toBe('CL');
      expect(result.status).toBe('processed');
      expect(result.message).toBe('Appointment processed successfully for CL');

      expect(mockScheduleRepository.markAsReserved).toHaveBeenCalledWith(200, CountryISO.CHILE);
    });

    it('should throw error when appointment not found', async () => {
      // Arrange
      const dto: ProcessAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(null);

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Appointment with ID 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });

    it('should throw error when appointment is not pending', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100);
      appointment.markAsProcessed(); // Already processed

      const dto: ProcessAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow(
        'is not in pending status'
      );
    });

    it('should throw error when country does not match', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100);

      const dto: ProcessAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'CL', // Different from appointment country (PE)
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Appointment country PE does not match processing country CL'
      );
    });

    it('should throw error for invalid country ISO', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100);

      const dto: ProcessAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'US', // Invalid country
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Unsupported country ISO: US'
      );
    });

    it('should handle repository update error', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100);

      const dto: ProcessAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockRejectedValue(new Error('Database update failed'));

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow('Database update failed');
    });

    it('should handle schedule reservation error', async () => {
      // Arrange
      const appointment = createTestAppointment('12345', CountryISO.PERU, 100);

      const dto: ProcessAppointmentDto = {
        appointmentId: appointment.getAppointmentId().getValue(),
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(appointment);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockRejectedValue(new Error('Schedule already reserved'));

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow('Schedule already reserved');
    });
  });
});
