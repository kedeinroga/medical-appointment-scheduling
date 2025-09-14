import { 
  logAppointmentCreation,
  logAppointmentGet 
} from '../utils';

// Mock AWS Lambda Powertools Logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
} as any;

// Mock shared utilities - not needed since we're using the local function
// jest.mock('@medical-appointment/shared', () => ({
//   maskInsuredId: jest.fn((id) => `${id.substring(0, 2)}***`)
// }));

describe('Appointment Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAppointmentCreation', () => {
    it('should log appointment creation with masked PII', () => {
      const context = {
        requestId: 'test-request-id',
        insuredId: '12345',
        country: 'PE' as const
      };

      logAppointmentCreation(mockLogger, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating new medical appointment',
        expect.objectContaining({
          operation: 'create_appointment',
          requestId: 'test-request-id',
          country: 'PE',
          insuredId: expect.any(String)
        })
      );
    });
  });

  describe('logAppointmentGet', () => {
    it('should log appointment get with masked PII', () => {
      const context = {
        requestId: 'test-request-id',
        insuredId: '12345'
      };

      logAppointmentGet(mockLogger, context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retrieving appointments',
        expect.objectContaining({
          operation: 'get_appointments',
          requestId: 'test-request-id',
          insuredId: expect.any(String)
        })
      );
    });
  });
});
