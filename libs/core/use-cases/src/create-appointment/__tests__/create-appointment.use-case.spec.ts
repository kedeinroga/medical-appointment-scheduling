import { CountryISO, IAppointmentRepository, IScheduleRepository } from '@medical-appointment/core-domain';

import { CreateAppointmentUseCase } from '../create-appointment.use-case';
import { IEventBus } from '../../ports/event-bus.port';
import { AppointmentTestFactory, ScheduleTestFactory, MockFactory } from '../../__tests__/test.factories';
import { TEST_DATA } from '../../__tests__/test.constants';

describe(CreateAppointmentUseCase.name, () => {
  let createAppointmentUseCase: CreateAppointmentUseCase;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockScheduleRepository: jest.Mocked<IScheduleRepository>;

  beforeEach(() => {
    mockAppointmentRepository = MockFactory.createAppointmentRepositoryMock();
    mockEventBus = MockFactory.createEventBusMock();
    mockScheduleRepository = MockFactory.createScheduleRepositoryMock();

    createAppointmentUseCase = new CreateAppointmentUseCase(
      mockAppointmentRepository,
      mockEventBus,
      mockScheduleRepository
    );
  });

  describe('execute', () => {
    it('should create appointment successfully for PE country', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createPeruDto();
      const mockSchedule = ScheduleTestFactory.createPeruSchedule();

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await createAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toBe('Appointment scheduling is in process');
      expect(result.status).toBe('pending');
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(
        TEST_DATA.VALID_SCHEDULE_IDS[1], // 100
        CountryISO.PERU
      );
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should create appointment successfully for CL country', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createChileDto();
      const mockSchedule = ScheduleTestFactory.createChileSchedule();

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await createAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBeDefined();
      expect(result.message).toBe('Appointment scheduling is in process');
      expect(result.status).toBe('pending');
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(
        TEST_DATA.VALID_SCHEDULE_IDS[2], // 200
        CountryISO.CHILE
      );
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid insured ID', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createValidDto({
        insuredId: '' // Empty string triggers validation error
      });

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Insured ID cannot be empty');
    });

    it('should throw error for invalid country ISO', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createValidDto({
        countryISO: TEST_DATA.INVALID_COUNTRIES[0] // 'US'
      });

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Unsupported country ISO: US');
    });

    it('should throw error when schedule not found', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createValidDto({
        scheduleId: 999
      });

      mockScheduleRepository.findByScheduleId.mockResolvedValue(null);

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Schedule with ID 999 not found for country PE');
    });

    it('should handle repository save error gracefully', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createPeruDto();
      const mockSchedule = ScheduleTestFactory.createPeruSchedule();

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Database connection failed');
    });

    it('should handle event bus publish error gracefully', async () => {
      // Arrange
      const dto = AppointmentTestFactory.createPeruDto();
      const mockSchedule = ScheduleTestFactory.createPeruSchedule();

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus unavailable'));

      // Act & Assert
      await expect(createAppointmentUseCase.execute(dto)).rejects.toThrow('Event bus unavailable');
    });
  });
});
