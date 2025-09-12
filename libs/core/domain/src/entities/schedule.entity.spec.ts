import { Schedule } from './schedule.entity';

describe('Schedule', () => {
  const createValidScheduleData = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    return {
      centerId: 1,
      date: futureDate,
      medicId: 2,
      scheduleId: 100,
      specialtyId: 3
    };
  };

  describe('create', () => {
    it('should create valid schedule', () => {
      // Arrange
      const data = createValidScheduleData();

      // Act
      const schedule = Schedule.create(data);

      // Assert
      expect(schedule.getCenterId()).toBe(1);
      expect(schedule.getMedicId()).toBe(2);
      expect(schedule.getScheduleId()).toBe(100);
      expect(schedule.getSpecialtyId()).toBe(3);
      expect(schedule.getDate()).toEqual(data.date);
    });

    it('should throw error for invalid schedule ID (zero)', () => {
      // Arrange
      const data = createValidScheduleData();
      data.scheduleId = 0;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Schedule ID must be a positive integer starting from 1'
      );
    });

    it('should throw error for negative schedule ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.scheduleId = -1;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Schedule ID must be a positive integer starting from 1'
      );
    });

    it('should throw error for invalid center ID (zero)', () => {
      // Arrange
      const data = createValidScheduleData();
      data.centerId = 0;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Center ID must be a positive integer'
      );
    });

    it('should throw error for negative center ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.centerId = -1;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Center ID must be a positive integer'
      );
    });

    it('should throw error for invalid specialty ID (zero)', () => {
      // Arrange
      const data = createValidScheduleData();
      data.specialtyId = 0;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Specialty ID must be a positive integer'
      );
    });

    it('should throw error for negative specialty ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.specialtyId = -1;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Specialty ID must be a positive integer'
      );
    });

    it('should throw error for invalid medic ID (zero)', () => {
      // Arrange
      const data = createValidScheduleData();
      data.medicId = 0;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Medic ID must be a positive integer'
      );
    });

    it('should throw error for negative medic ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.medicId = -1;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Medic ID must be a positive integer'
      );
    });

    it('should throw error for past date', () => {
      // Arrange
      const data = createValidScheduleData();
      data.date = new Date('2020-01-01');

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Schedule date cannot be in the past'
      );
    });

    it('should throw error for invalid date', () => {
      // Arrange
      const data = createValidScheduleData();
      data.date = new Date('invalid-date');

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Date must be a valid Date object'
      );
    });

    it('should throw error for non-integer schedule ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.scheduleId = 1.5;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Schedule ID must be a positive integer starting from 1'
      );
    });

    it('should throw error for non-integer center ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.centerId = 1.5;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Center ID must be a positive integer'
      );
    });

    it('should throw error for non-integer specialty ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.specialtyId = 1.5;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Specialty ID must be a positive integer'
      );
    });

    it('should throw error for non-integer medic ID', () => {
      // Arrange
      const data = createValidScheduleData();
      data.medicId = 1.5;

      // Act & Assert
      expect(() => Schedule.create(data)).toThrow(
        'Medic ID must be a positive integer'
      );
    });
  });

  describe('getDate', () => {
    it('should return a copy of the date', () => {
      // Arrange
      const data = createValidScheduleData();
      const schedule = Schedule.create(data);

      // Act
      const returnedDate = schedule.getDate();
      returnedDate.setDate(returnedDate.getDate() + 1);

      // Assert
      expect(schedule.getDate()).toEqual(data.date);
    });
  });

  describe('equals', () => {
    it('should return true for schedules with same ID', () => {
      // Arrange
      const data1 = createValidScheduleData();
      const data2 = { ...data1, centerId: 999 }; // Different center but same schedule ID
      
      const schedule1 = Schedule.create(data1);
      const schedule2 = Schedule.create(data2);

      // Act & Assert
      expect(schedule1.equals(schedule2)).toBe(true);
    });

    it('should return false for schedules with different IDs', () => {
      // Arrange
      const data1 = createValidScheduleData();
      const data2 = { ...data1, scheduleId: 200 };
      
      const schedule1 = Schedule.create(data1);
      const schedule2 = Schedule.create(data2);

      // Act & Assert
      expect(schedule1.equals(schedule2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize schedule to JSON', () => {
      // Arrange
      const data = createValidScheduleData();
      const schedule = Schedule.create(data);

      // Act
      const json = schedule.toJSON();

      // Assert
      expect(json).toEqual({
        centerId: data.centerId,
        date: data.date.toISOString(),
        medicId: data.medicId,
        scheduleId: data.scheduleId,
        specialtyId: data.specialtyId
      });
    });
  });
});
