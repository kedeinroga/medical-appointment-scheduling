// Third-party imports
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@aws-lambda-powertools/logger';

// Domain imports
import { CountryISO } from '@medical-appointment/core-domain';

// Infrastructure imports
import { AWS_CONFIG, getSQSUrlByCountry } from '../../config/aws.config';
import { SQSError } from '../../errors/aws.errors';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * SQS Adapter for queue operations
 * Implements the Adapter pattern to integrate with AWS SQS
 * Uses @Singleton decorator to ensure efficient SQS client management
 */
@Singleton
export class SQSAdapter {
  private readonly sqsClient: SQSClient;
  private readonly logger: Logger;

  constructor() {
    this.sqsClient = new SQSClient({
      region: AWS_CONFIG.AWS_REGION
    });
    this.logger = new Logger({
      serviceName: 'sqs-adapter'
    });
  }

  async sendMessageToCountryQueue(
    appointmentData: {
      appointmentId: string;
      countryISO: string;
      insuredId: string;
      scheduleId: number;
    }
  ): Promise<void> {
    try {
      const queueUrl = getSQSUrlByCountry(appointmentData.countryISO);
      
      const message = {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        eventType: 'ProcessAppointment',
        insuredId: appointmentData.insuredId,
        scheduleId: appointmentData.scheduleId,
        timestamp: new Date().toISOString()
      };

      const command = new SendMessageCommand({
        MessageAttributes: {
          countryISO: {
            DataType: 'String',
            StringValue: appointmentData.countryISO
          },
          eventType: {
            DataType: 'String',
            StringValue: 'ProcessAppointment'
          }
        },
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl
      });

      const result = await this.sqsClient.send(command);

      this.logger.info('Message sent to country queue successfully', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        messageId: result.MessageId,
        queueUrl
      });

    } catch (error) {
      this.logger.error('Failed to send message to country queue', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new SQSError('sendMessageToCountryQueue', error as Error);
    }
  }

  async sendMessageToCompletionQueue(
    appointmentData: {
      appointmentId: string;
      countryISO: string;
      status: string;
    }
  ): Promise<void> {
    try {
      const queueUrl = AWS_CONFIG.APPOINTMENTS_COMPLETION_QUEUE_URL;
      
      const message = {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        eventType: 'CompleteAppointment',
        status: appointmentData.status,
        timestamp: new Date().toISOString()
      };

      const command = new SendMessageCommand({
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: 'CompleteAppointment'
          }
        },
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl
      });

      const result = await this.sqsClient.send(command);

      this.logger.info('Message sent to completion queue successfully', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        messageId: result.MessageId,
        queueUrl
      });

    } catch (error) {
      this.logger.error('Failed to send message to completion queue', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new SQSError('sendMessageToCompletionQueue', error as Error);
    }
  }

  async sendMessage(queueUrl: string, messageBody: any, attributes?: Record<string, string>): Promise<string> {
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

      const command = new SendMessageCommand({
        MessageAttributes: messageAttributes,
        MessageBody: JSON.stringify(messageBody),
        QueueUrl: queueUrl
      });

      const result = await this.sqsClient.send(command);

      this.logger.info('Message sent successfully', {
        messageId: result.MessageId,
        queueUrl
      });

      return result.MessageId || '';

    } catch (error) {
      this.logger.error('Failed to send message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        queueUrl
      });
      throw new SQSError('sendMessage', error as Error);
    }
  }

  async receiveMessages(queueUrl: string, maxMessages: number = 1): Promise<any[]> {
    try {
      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages: maxMessages,
        QueueUrl: queueUrl,
        WaitTimeSeconds: 20 // Long polling
      });

      const result = await this.sqsClient.send(command);
      const messages = result.Messages || [];

      this.logger.info('Messages received successfully', {
        count: messages.length,
        queueUrl
      });

      return messages.map(message => ({
        body: message.Body ? JSON.parse(message.Body) : null,
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle
      }));

    } catch (error) {
      this.logger.error('Failed to receive messages', {
        error: error instanceof Error ? error.message : 'Unknown error',
        queueUrl
      });
      throw new SQSError('receiveMessages', error as Error);
    }
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      });

      await this.sqsClient.send(command);

      this.logger.info('Message deleted successfully', {
        queueUrl,
        receiptHandle
      });

    } catch (error) {
      this.logger.error('Failed to delete message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        queueUrl,
        receiptHandle
      });
      throw new SQSError('deleteMessage', error as Error);
    }
  }
}
