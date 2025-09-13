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

  describe('execute', () => {
    it('should process Peru appointment successfully', async () => {
      // Arrange
      const dto: ProcessAppointmentDto = {
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

      // Create mock appointment in pending status (from DynamoDB)
      const mockOriginalAppointment = Appointment.fromPrimitives({
        appointmentId: dto.appointmentId,
        insuredId: dto.insuredId,
        countryISO: dto.countryISO,
        schedule: {
          scheduleId: dto.scheduleId,
          centerId: 1,
          specialtyId: 1,
          medicId: 1,
          date: new Date('2025-12-01T10:00:00Z')
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(mockOriginalAppointment);
      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await processAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(dto.appointmentId);
      expect(result.countryISO).toBe('PE');
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Appointment created and sent for processing to PE');

      // Verify schedule was found
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(100, CountryISO.PERU);
      
      // Verify appointment was saved to DynamoDB with pending status
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify event was published for country processing
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      
      // Should NOT call update (that's for completion), should NOT call markAsReserved (that's for country processing)
      expect(mockAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByAppointmentId).not.toHaveBeenCalled();
      expect(mockScheduleRepository.markAsReserved).not.toHaveBeenCalled();
    });

    it('should process Chile appointment successfully', async () => {
      // Arrange
      const dto: ProcessAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440001',
        countryISO: 'CL',
        insuredId: '67890',
        scheduleId: 200
      };

      const mockSchedule = Schedule.create({
        centerId: 2,
        date: new Date('2025-12-01T14:00:00Z'),
        medicId: 2,
        scheduleId: 200,
        specialtyId: 2
      });

      // Create mock appointment in pending status (from DynamoDB)
      const mockOriginalAppointment = Appointment.fromPrimitives({
        appointmentId: dto.appointmentId,
        insuredId: dto.insuredId,
        countryISO: dto.countryISO,
        schedule: {
          scheduleId: dto.scheduleId,
          centerId: 2,
          specialtyId: 2,
          medicId: 2,
          date: new Date('2025-12-01T14:00:00Z')
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(mockOriginalAppointment);
      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockScheduleRepository.markAsReserved.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await processAppointmentUseCase.execute(dto);

      // Assert
      expect(result.appointmentId).toBe(dto.appointmentId);
      expect(result.countryISO).toBe('CL');
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Appointment created and sent for processing to CL');

      // Verify schedule was found
      expect(mockScheduleRepository.findByScheduleId).toHaveBeenCalledWith(200, CountryISO.CHILE);
      
      // Verify appointment was saved to DynamoDB with pending status
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
      
      // Verify event was published for country processing
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      
      // Should NOT call update (that's for completion), should NOT call markAsReserved (that's for country processing)
      expect(mockAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByAppointmentId).not.toHaveBeenCalled();
      expect(mockScheduleRepository.markAsReserved).not.toHaveBeenCalled();
    });

    it('should throw error when schedule not found', async () => {
      // Arrange
      const dto: ProcessAppointmentDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440000',
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      // Mock original appointment found, but schedule not found
      const mockOriginalAppointment = Appointment.fromPrimitives({
        appointmentId: dto.appointmentId,
        insuredId: dto.insuredId,
        countryISO: dto.countryISO,
        schedule: {
          scheduleId: dto.scheduleId,
          centerId: 1,
          specialtyId: 1,
          medicId: 1,
          date: new Date('2025-12-01T10:00:00Z')
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(mockOriginalAppointment);
      mockScheduleRepository.findByScheduleId.mockResolvedValue(null);

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow(
        'Schedule with ID 100 not found for country PE'
      );
    });

    it('should handle repository save error', async () => {
      // Arrange
      const dto: ProcessAppointmentDto = {
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

      // Mock original appointment found
      const mockOriginalAppointment = Appointment.fromPrimitives({
        appointmentId: dto.appointmentId,
        insuredId: dto.insuredId,
        countryISO: dto.countryISO,
        schedule: {
          scheduleId: dto.scheduleId,
          centerId: 1,
          specialtyId: 1,
          medicId: 1,
          date: new Date('2025-12-01T10:00:00Z')
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockAppointmentRepository.findByAppointmentId.mockResolvedValue(mockOriginalAppointment);
      mockScheduleRepository.findByScheduleId.mockResolvedValue(mockSchedule);
      mockAppointmentRepository.update.mockResolvedValue(undefined);
      mockAppointmentRepository.save.mockRejectedValue(new Error('Database save failed'));

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow('Database save failed');
    });

    it('should handle event bus publish error', async () => {
      // Arrange
      const dto: ProcessAppointmentDto = {
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
      mockAppointmentRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus connection failed'));

      // Act & Assert
      await expect(processAppointmentUseCase.execute(dto)).rejects.toThrow('Event bus connection failed');
    });
  });
});
