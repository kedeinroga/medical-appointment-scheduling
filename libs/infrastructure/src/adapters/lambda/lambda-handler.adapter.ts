// Third-party imports
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Use Cases imports  
import { CreateAppointmentDto, GetAppointmentsDto } from '@medical-appointment/core-use-cases';

// Infrastructure imports
import { ValidationError } from '../../errors/aws.errors';
import { InfrastructureBridgeFactory } from '../../factories/infrastructure-bridge.factory';

/**
 * Lambda Handler Adapter for API Gateway and SQS events
 * Implements the Adapter pattern to abstract AWS Lambda specifics from business logic
 */
export class LambdaHandlerAdapter {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({
      serviceName: 'lambda-handler-adapter'
    });
  }

  /**
   * Handles API Gateway events for the appointment endpoint
   */
  async handleAPIGateway(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const correlationId = context.awsRequestId;
    
    // Log request context
    this.logger.info('Processing API Gateway request', {
      awsRequestId: correlationId,
      httpMethod: event.httpMethod,
      path: event.path
    });

    try {
      switch (event.httpMethod) {
        case 'POST':
          return await this.handleCreateAppointment(event, correlationId);
        case 'GET':
          return await this.handleGetAppointments(event, correlationId);
        default:
          return this.createErrorResponse(405, 'Method not allowed');
      }
    } catch (error) {
      this.logger.error('Unhandled error in Lambda handler', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Handles SQS events for appointment processing
   */
  async handleSQS(event: SQSEvent): Promise<void> {
    this.logger.info('Processing SQS event', {
      recordCount: event.Records.length
    });

    for (const record of event.Records) {
      try {
        const messageBody = JSON.parse(record.body);
        
        this.logger.info('Processing SQS message', {
          messageId: record.messageId,
          eventType: messageBody.eventType
        });

        // Handle different event types
        switch (messageBody.eventType) {
          case 'ProcessAppointment':
            await this.handleProcessAppointment(messageBody);
            break;
          case 'CompleteAppointment':
            await this.handleCompleteAppointment(messageBody);
            break;
          default:
            this.logger.warn('Unknown event type in SQS message', {
              eventType: messageBody.eventType,
              messageId: record.messageId
            });
        }

      } catch (error) {
        this.logger.error('Failed to process SQS message', {
          error: error instanceof Error ? error.message : 'Unknown error',
          messageId: record.messageId
        });
        // Rethrow to send message to DLQ
        throw error;
      }
    }
  }

  /**
   * Handles POST /appointments - Create appointment
   */
  private async handleCreateAppointment(
    event: APIGatewayProxyEvent, 
    correlationId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return this.createErrorResponse(400, 'Request body is required');
      }

      const requestData = JSON.parse(event.body);
      
      // Validate required fields
      this.validateCreateAppointmentRequest(requestData);

      const dto: CreateAppointmentDto = {
        countryISO: requestData.countryISO,
        insuredId: requestData.insuredId,
        scheduleId: requestData.scheduleId
      };

      const useCase = InfrastructureBridgeFactory.createCreateAppointmentUseCase();
      const result = await useCase.execute(dto);

      this.logger.info('Appointment created successfully', {
        appointmentId: result.appointmentId,
        correlationId
      });

      return this.createSuccessResponse(201, result);

    } catch (error) {
      if (error instanceof ValidationError) {
        return this.createErrorResponse(400, error.message);
      }

      this.logger.error('Failed to create appointment', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createErrorResponse(500, 'Failed to create appointment');
    }
  }

  /**
   * Handles GET /appointments/{insuredId} - Get appointments by insured ID
   */
  private async handleGetAppointments(
    event: APIGatewayProxyEvent, 
    correlationId: string
  ): Promise<APIGatewayProxyResult> {
    try {
      const insuredId = event.pathParameters?.insuredId;
      
      if (!insuredId) {
        return this.createErrorResponse(400, 'insuredId path parameter is required');
      }

      // Validate insured ID format
      if (!/^\d{5}$/.test(insuredId)) {
        return this.createErrorResponse(400, 'insuredId must be exactly 5 digits');
      }

      const dto: GetAppointmentsDto = {
        insuredId
      };

      const useCase = InfrastructureBridgeFactory.createGetAppointmentsByInsuredIdUseCase();
      const result = await useCase.execute(dto);

      this.logger.info('Appointments retrieved successfully', {
        correlationId,
        count: result.appointments.length
      });

      return this.createSuccessResponse(200, result);

    } catch (error) {
      this.logger.error('Failed to get appointments', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createErrorResponse(500, 'Failed to get appointments');
    }
  }

  /**
   * Handles appointment processing for country-specific lambdas
   */
  private async handleProcessAppointment(messageBody: any): Promise<void> {
    // This would be implemented in country-specific handlers
    this.logger.info('Processing appointment', {
      appointmentId: messageBody.appointmentId,
      countryISO: messageBody.countryISO
    });
  }

  /**
   * Handles appointment completion
   */
  private async handleCompleteAppointment(messageBody: any): Promise<void> {
    // This would be implemented in the completion handler
    this.logger.info('Completing appointment', {
      appointmentId: messageBody.appointmentId
    });
  }

  /**
   * Validates create appointment request data
   */
  private validateCreateAppointmentRequest(data: any): void {
    if (!data.insuredId || typeof data.insuredId !== 'string') {
      throw new ValidationError('insuredId', 'insuredId is required and must be a string');
    }

    if (!/^\d{5}$/.test(data.insuredId)) {
      throw new ValidationError('insuredId', 'insuredId must be exactly 5 digits');
    }

    if (!data.scheduleId || typeof data.scheduleId !== 'number') {
      throw new ValidationError('scheduleId', 'scheduleId is required and must be a number');
    }

    if (!data.countryISO || typeof data.countryISO !== 'string') {
      throw new ValidationError('countryISO', 'countryISO is required and must be a string');
    }

    if (!['PE', 'CL'].includes(data.countryISO)) {
      throw new ValidationError('countryISO', 'countryISO must be either PE or CL');
    }
  }

  /**
   * Creates a success HTTP response
   */
  private createSuccessResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      },
      statusCode
    };
  }

  /**
   * Creates an error HTTP response
   */
  private createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
    return {
      body: JSON.stringify({
        error: message,
        statusCode
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      },
      statusCode
    };
  }
}
