import { CountryProcessingCompositionFactory } from '../country-processing-composition.factory';
import { ProcessCountryAppointmentUseCase } from '../../process-country-appointment/process-country-appointment.use-case';
import { CountryISO } from '../../../../../core/domain/src/value-objects/country-iso.vo';

describe('CountryProcessingCompositionFactory', () => {
  let mockAppointmentRepository: any;
  let mockEventBus: any;
  let mockScheduleRepository: any;
  let mockCountryISO: CountryISO;

  beforeEach(() => {
    mockAppointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByInsuredId: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
    };

    mockScheduleRepository = {
      findById: jest.fn(),
      findByDoctorId: jest.fn(),
    };

    mockCountryISO = CountryISO.fromString('PE');
  });

  describe('createProcessCountryAppointmentUseCase', () => {
    it('should create ProcessCountryAppointmentUseCase with provided dependencies', () => {
      const useCase = CountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository,
        mockCountryISO
      );

      expect(useCase).toBeInstanceOf(ProcessCountryAppointmentUseCase);
    });

    it('should create ProcessCountryAppointmentUseCase without countryISO parameter', () => {
      const useCase = CountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository
      );

      expect(useCase).toBeInstanceOf(ProcessCountryAppointmentUseCase);
    });
  });

  describe('createCountryProcessingComposition', () => {
    it('should create complete composition with all dependencies', () => {
      const composition = CountryProcessingCompositionFactory.createCountryProcessingComposition(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository,
        mockCountryISO
      );

      expect(composition).toHaveProperty('processCountryAppointmentUseCase');
      expect(composition).toHaveProperty('countryISO');
      expect(composition.processCountryAppointmentUseCase).toBeInstanceOf(ProcessCountryAppointmentUseCase);
      expect(composition.countryISO).toBe('PE');
    });

    it('should create composition for Chile country', () => {
      const chileCountryISO = CountryISO.fromString('CL');
      
      const composition = CountryProcessingCompositionFactory.createCountryProcessingComposition(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository,
        chileCountryISO
      );

      expect(composition.countryISO).toBe('CL');
      expect(composition.processCountryAppointmentUseCase).toBeInstanceOf(ProcessCountryAppointmentUseCase);
    });

    it('should return different instances when called multiple times', () => {
      const composition1 = CountryProcessingCompositionFactory.createCountryProcessingComposition(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository,
        mockCountryISO
      );

      const composition2 = CountryProcessingCompositionFactory.createCountryProcessingComposition(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository,
        mockCountryISO
      );

      // The factory creates new instances each time
      expect(composition1.processCountryAppointmentUseCase).not.toBe(composition2.processCountryAppointmentUseCase);
      expect(composition1.countryISO).toBe(composition2.countryISO);
    });
  });
});
