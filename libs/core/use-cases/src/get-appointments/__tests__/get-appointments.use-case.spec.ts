import { Appointment, CountryISO, IAppointmentRepository, Insured, InsuredId, Schedule } from '@medical-appointment/core-domain';

import { GetAppointmentsByInsuredIdUseCase } from '../get-appointments.use-case';
import { GetAppointmentsDto } from '../get-appointments.dto';

describe(GetAppointmentsByInsuredIdUseCase.name, () => {
  let getAppointmentsUseCase: GetAppointmentsByInsuredIdUseCase;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;

  beforeEach(() => {
    mockAppointmentRepository = {
      findByAppointmentId: jest.fn(),
      findByInsuredId: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    getAppointmentsUseCase = new GetAppointmentsByInsuredIdUseCase(
      mockAppointmentRepository
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
    it('should return appointments for valid insured ID', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '12345'
      };

      const mockAppointments = [
        createTestAppointment('12345', CountryISO.PERU, 100),
        createTestAppointment('12345', CountryISO.PERU, 200)
      ];

      // Mark one as processed for variety
      mockAppointments[1].markAsProcessed();

      mockAppointmentRepository.findByInsuredId.mockResolvedValue(mockAppointments);

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert
      expect(result.appointments).toHaveLength(2);
      expect(result.appointments[0].insuredId).toBe('12345');
      expect(result.appointments[0].countryISO).toBe('PE');
      expect(result.appointments[0].status).toBe('pending');
      expect(result.appointments[0].scheduleId).toBe(100);
      expect(result.appointments[0].processedAt).toBeNull();

      expect(result.appointments[1].insuredId).toBe('12345');
      expect(result.appointments[1].status).toBe('processed');
      expect(result.appointments[1].scheduleId).toBe(200);
      expect(result.appointments[1].processedAt).toBeDefined();

      expect(mockAppointmentRepository.findByInsuredId).toHaveBeenCalledWith(
        expect.objectContaining({
          value: '12345'
        })
      );
    });

    it('should return empty array when no appointments found', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '99999'
      };

      mockAppointmentRepository.findByInsuredId.mockResolvedValue([]);

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert
      expect(result.appointments).toHaveLength(0);
      expect(mockAppointmentRepository.findByInsuredId).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid insured ID', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: 'abcdef' // Invalid: no digits
      };

      // No need to mock repository calls since validation should fail first

      // Act & Assert
      await expect(getAppointmentsUseCase.execute(dto)).rejects.toThrow('Insured ID must contain at least one digit');
    });

    it('should handle repository error', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '12345'
      };

      mockAppointmentRepository.findByInsuredId.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(getAppointmentsUseCase.execute(dto)).rejects.toThrow('Database connection failed');
    });

    it('should return appointments with different statuses', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '12345'
      };

      const mockAppointments = [
        createTestAppointment('12345', CountryISO.PERU, 100),
        createTestAppointment('12345', CountryISO.CHILE, 200),
        createTestAppointment('12345', CountryISO.PERU, 300)
      ];

      // Set different statuses
      mockAppointments[1].markAsProcessed();
      mockAppointments[2].markAsProcessed();
      mockAppointments[2].markAsCompleted();

      mockAppointmentRepository.findByInsuredId.mockResolvedValue(mockAppointments);

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert
      expect(result.appointments).toHaveLength(3);
      expect(result.appointments[0].status).toBe('pending');
      expect(result.appointments[1].status).toBe('processed');
      expect(result.appointments[2].status).toBe('completed');

      // Verify country mappings
      expect(result.appointments[0].countryISO).toBe('PE');
      expect(result.appointments[1].countryISO).toBe('CL');
      expect(result.appointments[2].countryISO).toBe('PE');
    });
  });
});
