import axios, { AxiosResponse } from 'axios';

/**
 * Real HTTP E2E Test Suite for Medical Appointment Scheduling
 * 
 * This test makes actual HTTP requests to the deployed API to validate
 * the complete information flow in a real environment.
 * 
 * Usage: STAGE=dev API_GATEWAY_URL=https://your-api.execute-api.region.amazonaws.com/dev npm run test:e2e:dev
 */

interface AppointmentRequest {
  insuredId: string;
  scheduleId: number;
  countryISO: string;
}

interface AppointmentResponse {
  data: {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    status: string;
    createdAt: string;
  };
  timestamp: string;
}

interface AppointmentsListResponse {
  data: {
    appointments: Array<{
      appointmentId: string;
      countryISO: string;
      createdAt: string;
      insuredId: string;
      processedAt: string | null;
      schedule: {
        centerId: number;
        date: string;
        medicId: number;
        specialtyId: number;
      };
      scheduleId: number;
      status: string;
      updatedAt: string;
    }>;
    pagination: {
      count: number;
    };
  };
  timestamp: string;
}

describe('Real HTTP E2E Tests', () => {
  const apiBaseUrl = process.env.API_GATEWAY_URL;
  const stage = process.env.STAGE || 'dev';
  
  // Test configuration based on environment
  const config = {
    timeout: stage === 'prod' ? 60000 : 30000,
    retryAttempts: stage === 'prod' ? 5 : 3,
    waitTime: stage === 'prod' ? 10000 : 5000
  };

  beforeAll(() => {
    if (!apiBaseUrl) {
      console.warn('⚠️  API_GATEWAY_URL not set. Skipping real HTTP tests.');
      console.log('💡 To run real E2E tests, set API_GATEWAY_URL environment variable');
      console.log('   Example: API_GATEWAY_URL=https://abc123.execute-api.us-east-1.amazonaws.com/dev npm run test:e2e:dev');
    } else {
      console.log(`🌐 Running real HTTP E2E tests against: ${apiBaseUrl}`);
    }

    jest.setTimeout(config.timeout);
  });

  // Helper function to make HTTP requests with retry logic
  const makeRequest = async <T>(
    method: 'GET' | 'POST',
    path: string,
    data?: any,
    retries: number = config.retryAttempts
  ): Promise<AxiosResponse<T>> => {
    const url = `${apiBaseUrl}${path}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios({
          method,
          url,
          data,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });
        
        return response;
      } catch (error: any) {
        console.log(`❌ Attempt ${attempt}/${retries} failed for ${method} ${path}:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('All retry attempts failed');
  };

  // Helper to wait for async processing
  const waitForProcessing = async (): Promise<void> => {
    console.log(`⏳ Waiting ${config.waitTime}ms for async processing...`);
    await new Promise(resolve => setTimeout(resolve, config.waitTime));
  };

  describe('🌐 Real API Testing', () => {
    
    it('should validate API is accessible', async () => {
      if (!apiBaseUrl) {
        console.log('⏭️  Skipping real API test - API_GATEWAY_URL not set');
        return;
      }

      // Try to make a simple request to check API accessibility
      try {
        await makeRequest('GET', '/appointments/99999'); // Non-existent ID should return 200 with empty array or 404
        console.log('✅ API is accessible');
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 200) {
          console.log('✅ API is accessible (returned expected error/empty response)');
        } else {
          throw error;
        }
      }
    });

    it('should complete full appointment flow for PE country via HTTP', async () => {
      if (!apiBaseUrl) {
        console.log('⏭️  Skipping HTTP test - API_GATEWAY_URL not set');
        return;
      }

      const testInsuredId = `test${Date.now()}`;
      const appointmentRequest: AppointmentRequest = {
        insuredId: testInsuredId,
        scheduleId: 1,
        countryISO: 'PE'
      };

      console.log('🚀 Starting real HTTP E2E test for PE...');

      // Step 1: Create appointment
      console.log('📝 Creating appointment via HTTP POST...');
      const createResponse = await makeRequest<AppointmentResponse>(
        'POST',
        '/appointments',
        appointmentRequest
      );

      expect(createResponse.status).toBe(201);
      expect(createResponse.data.data.appointmentId).toBeDefined();
      expect(createResponse.data.data.status).toBe('pending');
      expect(createResponse.data.data.countryISO).toBe('PE');
      expect(createResponse.data.data.insuredId).toBe(testInsuredId);

      const appointmentId = createResponse.data.data.appointmentId;
      console.log('✅ Appointment created:', appointmentId);

      // Step 2: Wait for async processing
      await waitForProcessing();

      // Step 3: Retrieve appointment
      console.log('📖 Retrieving appointment via HTTP GET...');
      const getResponse = await makeRequest<AppointmentsListResponse>(
        'GET',
        `/appointments/${testInsuredId}`
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data.appointments).toBeDefined();
      expect(Array.isArray(getResponse.data.data.appointments)).toBe(true);
      expect(getResponse.data.data.pagination.count).toBeGreaterThan(0);

      // Find our appointment
      const appointment = getResponse.data.data.appointments.find(
        apt => apt.appointmentId === appointmentId
      );

      expect(appointment).toBeDefined();
      expect(appointment!.insuredId).toBe(testInsuredId);
      expect(appointment!.countryISO).toBe('PE');
      expect(appointment!.scheduleId).toBe(1);
      
      // Status should be 'pending' or 'completed' depending on processing speed
      expect(['pending', 'completed']).toContain(appointment!.status);

      // Validate complete data structure
      expect(appointment).toEqual(
        expect.objectContaining({
          appointmentId: expect.any(String),
          countryISO: 'PE',
          createdAt: expect.any(String),
          insuredId: testInsuredId,
          schedule: expect.objectContaining({
            centerId: expect.any(Number),
            date: expect.any(String),
            medicId: expect.any(Number),
            specialtyId: expect.any(Number)
          }),
          scheduleId: 1,
          status: expect.stringMatching(/^(pending|completed)$/),
          updatedAt: expect.any(String)
        })
      );

      console.log('🎉 Real HTTP E2E test completed successfully!');
      console.log('📊 Final appointment status:', appointment!.status);
    });

    it('should complete full appointment flow for CL country via HTTP', async () => {
      if (!apiBaseUrl) {
        console.log('⏭️  Skipping HTTP test - API_GATEWAY_URL not set');
        return;
      }

      const testInsuredId = `testCL${Date.now()}`;
      const appointmentRequest: AppointmentRequest = {
        insuredId: testInsuredId,
        scheduleId: 2,
        countryISO: 'CL'
      };

      console.log('🚀 Starting real HTTP E2E test for CL...');

      const createResponse = await makeRequest<AppointmentResponse>(
        'POST',
        '/appointments',
        appointmentRequest
      );

      expect(createResponse.status).toBe(201);
      expect(createResponse.data.data.countryISO).toBe('CL');

      console.log('✅ CL appointment created via HTTP');
      
      await waitForProcessing();

      const getResponse = await makeRequest<AppointmentsListResponse>(
        'GET',
        `/appointments/${testInsuredId}`
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data.appointments.length).toBeGreaterThan(0);

      const appointment = getResponse.data.data.appointments[0];
      expect(appointment.countryISO).toBe('CL');

      console.log('🎉 CL HTTP E2E test completed successfully!');
    });

    it('should handle invalid requests properly via HTTP', async () => {
      if (!apiBaseUrl) {
        console.log('⏭️  Skipping HTTP test - API_GATEWAY_URL not set');
        return;
      }

      const invalidRequest = {
        insuredId: '12345',
        scheduleId: 1,
        countryISO: 'INVALID'
      };

      try {
        await makeRequest('POST', '/appointments', invalidRequest);
        fail('Should have thrown an error for invalid country');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        console.log('✅ Invalid request properly rejected via HTTP');
      }
    });

  });

  describe('🔍 API Health and Performance', () => {
    
    it('should respond within acceptable time limits', async () => {
      if (!apiBaseUrl) {
        console.log('⏭️  Skipping performance test - API_GATEWAY_URL not set');
        return;
      }

      const startTime = Date.now();
      
      try {
        await makeRequest('GET', '/appointments/99999');
      } catch (error: any) {
        // Even if it returns 404, we care about response time
      }
      
      const responseTime = Date.now() - startTime;
      const maxAcceptableTime = stage === 'prod' ? 5000 : 10000; // 5s for prod, 10s for dev
      
      expect(responseTime).toBeLessThan(maxAcceptableTime);
      console.log(`✅ API response time: ${responseTime}ms (limit: ${maxAcceptableTime}ms)`);
    });

    it('should handle concurrent requests properly', async () => {
      if (!apiBaseUrl) {
        console.log('⏭️  Skipping concurrency test - API_GATEWAY_URL not set');
        return;
      }

      const concurrentRequests = Array.from({ length: 3 }, (_, i) => 
        makeRequest('GET', `/appointments/concurrent${i}`)
      );

      const responses = await Promise.allSettled(concurrentRequests);
      
      // At least some requests should succeed (even if they return empty results)
      const successfulResponses = responses.filter(r => r.status === 'fulfilled');
      expect(successfulResponses.length).toBeGreaterThan(0);
      
      console.log(`✅ Handled ${successfulResponses.length}/3 concurrent requests successfully`);
    });

  });

});
