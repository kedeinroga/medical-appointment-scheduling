import { Appointment, CountryISO, IAppointmentRepository, Insured, InsuredId, Schedule } from '@medical-appointment/core-domain';

import { GetAppointmentsByInsuredIdUseCase } from '../get-appointments.use-case';
import { GetAppointmentsDto } from '../get-appointments.dto';

describe(GetAppointmentsByInsuredIdUseCase.name, () => {
  let getAppointmentsUseCase: GetAppointmentsByInsuredIdUseCase;
  let mockDynamoDbRepository: jest.Mocked<IAppointmentRepository>;
  let mockMysqlRepository: jest.Mocked<IAppointmentRepository>;

  beforeEach(() => {
    mockDynamoDbRepository = {
      findByAppointmentId: jest.fn(),
      findByInsuredId: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    mockMysqlRepository = {
      findByAppointmentId: jest.fn(),
      findByInsuredId: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    getAppointmentsUseCase = new GetAppointmentsByInsuredIdUseCase(
      mockDynamoDbRepository,
      mockMysqlRepository
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

      const dynamoAppointments = [
        createTestAppointment('12345', CountryISO.PERU, 100),
      ];

      const mysqlAppointments = [
        createTestAppointment('12345', CountryISO.PERU, 200)
      ];

      // Mark MySQL appointment as processed
      mysqlAppointments[0].markAsProcessed();

      mockDynamoDbRepository.findByInsuredId.mockResolvedValue(dynamoAppointments);
      mockMysqlRepository.findByInsuredId.mockResolvedValue(mysqlAppointments);

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert
      expect(result.appointments).toHaveLength(2);
      
      // Find appointments by scheduleId since order is not guaranteed
      const processedAppointment = result.appointments.find(apt => apt.scheduleId === 200);
      const pendingAppointment = result.appointments.find(apt => apt.scheduleId === 100);

      expect(processedAppointment).toBeDefined();
      expect(processedAppointment!.insuredId).toBe('12345');
      expect(processedAppointment!.countryISO).toBe('PE');
      expect(processedAppointment!.status).toBe('processed');
      expect(processedAppointment!.processedAt).toBeDefined();

      expect(pendingAppointment).toBeDefined();
      expect(pendingAppointment!.insuredId).toBe('12345');
      expect(pendingAppointment!.status).toBe('pending');
      expect(pendingAppointment!.processedAt).toBeNull();

      expect(mockDynamoDbRepository.findByInsuredId).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function)
        })
      );
      expect(mockMysqlRepository.findByInsuredId).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function)
        })
      );
    });

    it('should return empty array when no appointments found', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '99999'
      };

      mockDynamoDbRepository.findByInsuredId.mockResolvedValue([]);
      mockMysqlRepository.findByInsuredId.mockResolvedValue([]);

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert
      expect(result.appointments).toHaveLength(0);
      expect(mockDynamoDbRepository.findByInsuredId).toHaveBeenCalledTimes(1);
      expect(mockMysqlRepository.findByInsuredId).toHaveBeenCalledTimes(1);
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

    it('should handle repository error gracefully', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '12345'
      };

      // Both repositories fail
      mockDynamoDbRepository.findByInsuredId.mockRejectedValue(
        new Error('DynamoDB connection failed')
      );
      mockMysqlRepository.findByInsuredId.mockRejectedValue(
        new Error('MySQL connection failed')
      );

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert - Should return empty array when both repositories fail
      expect(result.appointments).toHaveLength(0);
    });

    it('should return appointments with different statuses', async () => {
      // Arrange
      const dto: GetAppointmentsDto = {
        insuredId: '12345'
      };

      const dynamoAppointments = [
        createTestAppointment('12345', CountryISO.PERU, 100),
      ];

      const mysqlAppointments = [
        createTestAppointment('12345', CountryISO.CHILE, 200),
        createTestAppointment('12345', CountryISO.PERU, 300)
      ];

      // Set different statuses
      mysqlAppointments[0].markAsProcessed();
      // mysqlAppointments[1] remains pending and can be completed
      mysqlAppointments[1].markAsCompleted();

      mockDynamoDbRepository.findByInsuredId.mockResolvedValue(dynamoAppointments);
      mockMysqlRepository.findByInsuredId.mockResolvedValue(mysqlAppointments);

      // Act
      const result = await getAppointmentsUseCase.execute(dto);

      // Assert
      expect(result.appointments).toHaveLength(3);
      
      // Verify country mappings (sorted by creation date descending)
      expect(result.appointments.some(apt => apt.status === 'pending')).toBe(true);
      expect(result.appointments.some(apt => apt.status === 'processed')).toBe(true);
      expect(result.appointments.some(apt => apt.status === 'completed')).toBe(true);
      expect(result.appointments.some(apt => apt.countryISO === 'PE')).toBe(true);
      expect(result.appointments.some(apt => apt.countryISO === 'CL')).toBe(true);
    });
  });
});
