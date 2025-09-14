// Third-party imports
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Logger } from '@aws-lambda-powertools/logger';

// Domain imports
import { CountryISO, IMessagingPort } from '@medical-appointment/core-domain';

// Infrastructure imports
import { AWS_CONFIG, getSNSTopicArnByCountry } from '../../config/aws.config';
import { SNSError } from '../../errors/aws.errors';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * SNS Adapter for messaging operations
 * Implements the Adapter pattern to integrate with AWS SNS
 * Uses @Singleton decorator to ensure efficient SNS client management
 */
@Singleton
export class SNSAdapter implements IMessagingPort {
  private readonly snsClient: SNSClient;
  private readonly logger: Logger;
  private readonly topicArn: string;

  constructor() {
    this.snsClient = new SNSClient({
      region: AWS_CONFIG.AWS_REGION
    });
    this.logger = new Logger({
      serviceName: 'sns-adapter'
    });
    this.topicArn = AWS_CONFIG.APPOINTMENTS_TOPIC_ARN;
  }

  async publishAppointmentCreated(appointmentData: {
    appointmentId: string;
    countryISO: string;
    insuredId: string;
    scheduleId: number;
  }): Promise<void> {
    try {
      const message = {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        eventType: 'AppointmentCreated',
        insuredId: appointmentData.insuredId,
        scheduleId: appointmentData.scheduleId,
        timestamp: new Date().toISOString()
      };

      const command = new PublishCommand({
        Message: JSON.stringify(message),
        MessageAttributes: {
          countryISO: {
            DataType: 'String',
            StringValue: appointmentData.countryISO
          },
          eventType: {
            DataType: 'String',
            StringValue: 'AppointmentCreated'
          }
        },
        TopicArn: this.topicArn
      });

      const result = await this.snsClient.send(command);

      this.logger.info('Appointment created message published successfully', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        messageId: result.MessageId,
        topicArn: this.topicArn,
        messageAttributes: {
          countryISO: appointmentData.countryISO,
          eventType: 'AppointmentCreated'
        },
        messageBody: message
      });

    } catch (error) {
      this.logger.error('Failed to publish appointment created message', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new SNSError('publishAppointmentCreated', error as Error);
    }
  }

  async publishMessage(message: any, attributes?: Record<string, string>): Promise<void> {
    try {
      const messageAttributes: Record<string, any> = {};

      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          messageAttributes[key] = {
            DataType: 'String',
            StringValue: value
          };
        });
      }

      const command = new PublishCommand({
        Message: JSON.stringify(message),
        MessageAttributes: messageAttributes,
        TopicArn: this.topicArn
      });

      const result = await this.snsClient.send(command);

      this.logger.info('Message published successfully', {
        messageId: result.MessageId,
        topicArn: this.topicArn
      });

    } catch (error) {
      this.logger.error('Failed to publish message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        topicArn: this.topicArn
      });
      throw new SNSError('publishMessage', error as Error);
    }
  }

  async publishToCountrySpecificTopic(
    message: any, 
    countryISO: CountryISO, 
    eventType: string
  ): Promise<void> {
    try {
      const countrySpecificTopicArn = getSNSTopicArnByCountry(countryISO.getValue());
      
      const messageAttributes: Record<string, any> = {
        countryISO: {
          DataType: 'String',
          StringValue: countryISO.getValue()
        },
        eventType: {
          DataType: 'String',
          StringValue: eventType
        }
      };

      const command = new PublishCommand({
        Message: JSON.stringify(message),
        MessageAttributes: messageAttributes,
        TopicArn: countrySpecificTopicArn
      });

      const result = await this.snsClient.send(command);

      this.logger.info('Message published to country-specific topic successfully', {
        messageId: result.MessageId,
        countryISO: countryISO.getValue(),
        eventType,
        topicArn: countrySpecificTopicArn
      });

    } catch (error) {
      this.logger.error('Failed to publish message to country-specific topic', {
        countryISO: countryISO.getValue(),
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new SNSError('publishToCountrySpecificTopic', error as Error);
    }
  }
}
