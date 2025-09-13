import { Appointment, AppointmentProcessedEvent, CountryISO, IAppointmentRepository, IEventBus, IScheduleRepository, Insured, InsuredId, Schedule } from '../../../../../core/domain/src';

import { ProcessCountryAppointmentUseCase } from '../process-country-appointment.use-case';
import { ProcessCountryAppointmentDto } from '../process-country-appointment.dto';

describe(ProcessCountryAppointmentUseCase.name, () => {
  let processCountryAppointmentUseCase: ProcessCountryAppointmentUseCase;
  let mockCountryAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockScheduleRepository: jest.Mocked<IScheduleRepository>;

  beforeEach(() => {
    mockCountryAppointmentRepository = {
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

    processCountryAppointmentUseCase = new ProcessCountryAppointmentUseCase(
      mockCountryAppointmentRepository,
      mockEventBus,
      mockScheduleRepository
    );
  });

  describe('execute', () => {
    it('should process Peru appointment successfully', async () => {
      // Arrange
      const dto: ProcessCountryAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
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
      mockCountryAppointmentRepository.save.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await processCountryAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(dto.appointmentId);
      expect(result.countryISO).toBe('PE');
      expect(result.status).toBe('processed');
      expect(result.message).toBe('Appointment processed successfully for PE');

      // Verify schedule was found
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(100, CountryISO.PERU);
      
      // Verify appointment was saved to MySQL with processed status
      expect(mockCountryAppointmentRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify schedule was marked as reserved
      expect(mockScheduleRepository.markAsReserved).toHaveBeenCalledWith(100, CountryISO.PERU);
      
      // Verify event was published for completion
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      
      // Should NOT call update or findByAppointmentId (no DynamoDB interaction)
      expect(mockCountryAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockCountryAppointmentRepository.findByAppointmentId).not.toHaveBeenCalled();
    });

    it('should process Chile appointment successfully', async () => {
      // Arrange
      const dto: ProcessCountryAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440001',
        countryISO: 'CL',
        insuredId: '54321',
        scheduleId: 200
      };

      const mockSchedule = Schedule.create({
        centerId: 2,
        date: new Date('2025-12-01T14:00:00Z'),
        medicId: 2,
        scheduleId: 200,
        specialtyId: 2
      });

      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockCountryAppointmentRepository.save.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await processCountryAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(dto.appointmentId);
      expect(result.countryISO).toBe('CL');
      expect(result.status).toBe('processed');
      expect(result.message).toBe('Appointment processed successfully for CL');

      // Verify schedule was found
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(200, CountryISO.CHILE);
      
      // Verify appointment was saved to MySQL with processed status
      expect(mockCountryAppointmentRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify schedule was marked as reserved
      expect(mockScheduleRepository.markAsReserved).toHaveBeenCalledWith(200, CountryISO.CHILE);
      
      // Verify event was published for completion
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should throw error when schedule not found', async () => {
      // Arrange
      const dto: ProcessCountryAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      mockScheduleRepository.findByScheduleId.mockResolvedValue(null);

      // Act & Assert
      await expect(processCountryAppointmentUseCase.execute(dto)).rejects.toThrow('Schedule with ID 100 not found for country PE');
    });

    it('should handle schedule reservation error', async () => {
      // Arrange
      const dto: ProcessCountryAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
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
      mockCountryAppointmentRepository.save.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockRejectedValue(new Error('Schedule already reserved'));

      // Act & Assert
      await expect(processCountryAppointmentUseCase.execute(dto)).rejects.toThrow('Schedule already reserved');
    });

    it('should handle event bus publish error', async () => {
      // Arrange
      const dto: ProcessCountryAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
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
      mockCountryAppointmentRepository.save.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus connection failed'));

      // Act & Assert
      await expect(processCountryAppointmentUseCase.execute(dto)).rejects.toThrow('Event bus connection failed');
    });
  });
});
