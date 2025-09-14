import { InfrastructureBridgeFactory } from '../infrastructure-bridge.factory';
import { AdapterFactory } from '../adapter.factory';
import { CountryProcessingFactory } from '../country-processing.factory';
import { UseCaseFactory, CountryProcessingCompositionFactory } from '@medical-appointment/core-use-cases';
import { CountryISO } from '@medical-appointment/core-domain';

// Mock all dependencies
jest.mock('../adapter.factory');
jest.mock('../country-processing.factory');
jest.mock('@medical-appointment/core-use-cases');

describe('InfrastructureBridgeFactory', () => {
  let mockAdapterFactory: jest.Mocked<typeof AdapterFactory>;
  let mockCountryProcessingFactory: jest.Mocked<typeof CountryProcessingFactory>;
  let mockUseCaseFactory: jest.Mocked<typeof UseCaseFactory>;
  let mockCountryProcessingCompositionFactory: jest.Mocked<typeof CountryProcessingCompositionFactory>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AdapterFactory
    mockAdapterFactory = AdapterFactory as jest.Mocked<typeof AdapterFactory>;
    mockAdapterFactory.createAppointmentRepository = jest.fn();
    mockAdapterFactory.createMySQLAppointmentRepository = jest.fn();
    mockAdapterFactory.createScheduleRepository = jest.fn();
    mockAdapterFactory.createSNSAdapter = jest.fn();
    mockAdapterFactory.createEventBridgeAdapter = jest.fn();

    // Mock CountryProcessingFactory
    mockCountryProcessingFactory = CountryProcessingFactory as jest.Mocked<typeof CountryProcessingFactory>;
    mockCountryProcessingFactory.createCountryProcessingAdapters = jest.fn();

    // Mock UseCaseFactory
    mockUseCaseFactory = UseCaseFactory as jest.Mocked<typeof UseCaseFactory>;
    mockUseCaseFactory.createCreateAppointmentUseCase = jest.fn();
    mockUseCaseFactory.createGetAppointmentsByInsuredIdUseCase = jest.fn();
    mockUseCaseFactory.createCompleteAppointmentUseCase = jest.fn();

    // Mock CountryProcessingCompositionFactory
    mockCountryProcessingCompositionFactory = CountryProcessingCompositionFactory as jest.Mocked<typeof CountryProcessingCompositionFactory>;
    mockCountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase = jest.fn();
    mockCountryProcessingCompositionFactory.createCountryProcessingComposition = jest.fn();
  });

  describe('createCreateAppointmentUseCase', () => {
    it('should create CreateAppointmentUseCase with proper dependencies', () => {
      // Arrange
      const mockRepository = {} as any;
      const mockMessagingAdapter = {} as any;
      const mockScheduleRepository = {} as any;
      const mockUseCase = {} as any;

      mockAdapterFactory.createAppointmentRepository.mockReturnValue(mockRepository);
      mockAdapterFactory.createSNSAdapter.mockReturnValue(mockMessagingAdapter);
      mockAdapterFactory.createScheduleRepository.mockReturnValue(mockScheduleRepository);
      mockUseCaseFactory.createCreateAppointmentUseCase.mockReturnValue(mockUseCase);

      // Act
      const result = InfrastructureBridgeFactory.createCreateAppointmentUseCase();

      // Assert
      expect(mockAdapterFactory.createAppointmentRepository).toHaveBeenCalled();
      expect(mockAdapterFactory.createSNSAdapter).toHaveBeenCalled();
      expect(mockAdapterFactory.createScheduleRepository).toHaveBeenCalled();
      expect(mockUseCaseFactory.createCreateAppointmentUseCase).toHaveBeenCalledWith(
        mockRepository,
        mockMessagingAdapter,
        mockScheduleRepository
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createGetAppointmentsByInsuredIdUseCase', () => {
    it('should create GetAppointmentsByInsuredIdUseCase with proper dependencies', () => {
      // Arrange
      const mockDynamoRepository = {} as any;
      const mockMySQLRepository = {} as any;
      const mockUseCase = {} as any;

      mockAdapterFactory.createAppointmentRepository.mockReturnValue(mockDynamoRepository);
      mockAdapterFactory.createMySQLAppointmentRepository.mockReturnValue(mockMySQLRepository);
      mockUseCaseFactory.createGetAppointmentsByInsuredIdUseCase.mockReturnValue(mockUseCase);

      // Act
      const result = InfrastructureBridgeFactory.createGetAppointmentsByInsuredIdUseCase();

      // Assert
      expect(mockAdapterFactory.createAppointmentRepository).toHaveBeenCalled();
      expect(mockAdapterFactory.createMySQLAppointmentRepository).toHaveBeenCalled();
      expect(mockUseCaseFactory.createGetAppointmentsByInsuredIdUseCase).toHaveBeenCalledWith(
        mockDynamoRepository,
        mockMySQLRepository
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createCompleteAppointmentUseCase', () => {
    it('should create CompleteAppointmentUseCase with proper dependencies', () => {
      // Arrange
      const mockRepository = {} as any;
      const mockEventBus = {} as any;
      const mockUseCase = {} as any;

      mockAdapterFactory.createAppointmentRepository.mockReturnValue(mockRepository);
      mockAdapterFactory.createEventBridgeAdapter.mockReturnValue(mockEventBus);
      mockUseCaseFactory.createCompleteAppointmentUseCase.mockReturnValue(mockUseCase);

      // Act
      const result = InfrastructureBridgeFactory.createCompleteAppointmentUseCase();

      // Assert
      expect(mockAdapterFactory.createAppointmentRepository).toHaveBeenCalled();
      expect(mockAdapterFactory.createEventBridgeAdapter).toHaveBeenCalled();
      expect(mockUseCaseFactory.createCompleteAppointmentUseCase).toHaveBeenCalledWith(
        mockRepository,
        mockEventBus
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createProcessCountryAppointmentUseCase', () => {
    it('should create ProcessCountryAppointmentUseCase with proper dependencies', () => {
      // Arrange
      const countryISO = CountryISO.fromString('PE');
      const mockCountryAdapters = {
        appointmentRepository: {} as any,
        eventBridgeAdapter: {} as any,
        scheduleRepository: {} as any
      };
      const mockUseCase = {} as any;

      mockCountryProcessingFactory.createCountryProcessingAdapters.mockReturnValue(mockCountryAdapters);
      mockCountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase.mockReturnValue(mockUseCase);

      // Act
      const result = InfrastructureBridgeFactory.createProcessCountryAppointmentUseCase(countryISO);

      // Assert
      expect(mockCountryProcessingFactory.createCountryProcessingAdapters).toHaveBeenCalledWith(countryISO);
      expect(mockCountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase).toHaveBeenCalledWith(
        mockCountryAdapters.appointmentRepository,
        mockCountryAdapters.eventBridgeAdapter,
        mockCountryAdapters.scheduleRepository,
        countryISO
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createCountryProcessingComposition', () => {
    it('should create country processing composition with proper dependencies', () => {
      // Arrange
      const countryISO = CountryISO.fromString('CL');
      const mockCountryAdapters = {
        appointmentRepository: {} as any,
        eventBridgeAdapter: {} as any,
        scheduleRepository: {} as any
      };
      const mockComposition = {} as any;

      mockCountryProcessingFactory.createCountryProcessingAdapters.mockReturnValue(mockCountryAdapters);
      mockCountryProcessingCompositionFactory.createCountryProcessingComposition.mockReturnValue(mockComposition);

      // Act
      const result = InfrastructureBridgeFactory.createCountryProcessingComposition(countryISO);

      // Assert
      expect(mockCountryProcessingFactory.createCountryProcessingAdapters).toHaveBeenCalledWith(countryISO);
      expect(mockCountryProcessingCompositionFactory.createCountryProcessingComposition).toHaveBeenCalledWith(
        mockCountryAdapters.appointmentRepository,
        mockCountryAdapters.eventBridgeAdapter,
        mockCountryAdapters.scheduleRepository,
        countryISO
      );
      expect(result).toBe(mockComposition);
    });
  });
});
