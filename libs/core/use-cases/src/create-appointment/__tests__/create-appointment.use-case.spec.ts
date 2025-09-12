import { CountryISO, IAppointmentRepository, IScheduleRepository, InsuredId, Schedule } from '@medical-appointment/core-domain';

import { CreateAppointmentUseCase } from '../create-appointment.use-case';
import { CreateAppointmentDto } from '../create-appointment.dto';
import { IEventBus } from '../../ports/event-bus.port';

describe(CreateAppointmentUseCase.name, () => {
  let createAppointmentUseCase: CreateAppointmentUseCase;
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

    createAppointmentUseCase = new CreateAppointmentUseCase(
      mockAppointmentRepository,
      mockEventBus,
      mockScheduleRepository
    );
  });

  describe('execute', () => {
    it('should create appointment successfully for PE country', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      const mockSchedule = Schedule.create({
        centerId: 1,
        date: new Date('2025-12-01T10:00:00Z'),
        medicId: 1,
        scheduleId: 100,
        specialtyId: 1
      });

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await createAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toBe('Appointment scheduling is in process');
      expect(result.status).toBe('pending');
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(100, CountryISO.PERU);
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should create appointment successfully for CL country', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'CL',
        insuredId: '67890',
        scheduleId: 200
      };

      const mockSchedule = Schedule.create({
        centerId: 2,
        date: new Date('2025-12-02T14:00:00Z'),
        medicId: 2,
        scheduleId: 200,
        specialtyId: 2
      });

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await createAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toBe('Appointment scheduling is in process');
      expect(result.status).toBe('pending');
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(200, CountryISO.CHILE);
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid insured ID', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'PE',
        insuredId: 'abcdef', // Invalid: no digits
        scheduleId: 100
      };

      // No need to mock repository calls since validation should fail first

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Insured ID must contain at least one digit');
    });

    it('should throw error for invalid country ISO', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'US', // Invalid country
        insuredId: '12345',
        scheduleId: 100
      };

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Unsupported country ISO: US');
    });

    it('should throw error when schedule not found', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 999
      };

      mockScheduleRepository.findByScheduleId.mockResolvedValue(null);

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Schedule with ID 999 not found for country PE');
    });

    it('should handle repository save error', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      const mockSchedule = Schedule.create({
        centerId: 1,
        date: new Date('2025-12-01T10:00:00Z'),
        medicId: 1,
        scheduleId: 100,
        specialtyId: 1
      });

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Database connection failed');
    });

    it('should handle event bus publish error', async () => {
      // Arrange
      const dto: CreateAppointmentDto = {
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      const mockSchedule = Schedule.create({
        centerId: 1,
        date: new Date('2025-12-01T10:00:00Z'),
        medicId: 1,
        scheduleId: 100,
        specialtyId: 1
      });

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus unavailable'));

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Event bus unavailable');
    });
  });
});
