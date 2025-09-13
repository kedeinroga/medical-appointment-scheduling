/**
 * AWS Configuration for Infrastructure Layer
 * Centralizes all AWS-related configuration with type safety
 */

export const AWS_CONFIG = {
  AWS_REGION: process.env.DEPLOYMENT_REGION || process.env.AWS_REGION || 'us-east-1',
  APPOINTMENTS_TABLE_NAME: process.env.APPOINTMENTS_TABLE_NAME || '',
  APPOINTMENTS_TOPIC_ARN: process.env.APPOINTMENTS_TOPIC_ARN || '',
  APPOINTMENTS_PE_TOPIC_ARN: process.env.APPOINTMENTS_PE_TOPIC_ARN || '',
  APPOINTMENTS_CL_TOPIC_ARN: process.env.APPOINTMENTS_CL_TOPIC_ARN || '',
  APPOINTMENTS_PE_QUEUE_URL: process.env.APPOINTMENTS_PE_QUEUE_URL || '',
  APPOINTMENTS_CL_QUEUE_URL: process.env.APPOINTMENTS_CL_QUEUE_URL || '',
  APPOINTMENTS_COMPLETION_QUEUE_URL: process.env.APPOINTMENTS_COMPLETION_QUEUE_URL || '',
  EVENTBRIDGE_BUS_NAME: process.env.EVENTBRIDGE_BUS_NAME || '',
  RDS_HOST: process.env.RDS_HOST || '',
  RDS_PASSWORD: process.env.RDS_PASSWORD || '',
  RDS_PORT: parseInt(process.env.RDS_PORT || '3306'),
  RDS_USERNAME: process.env.RDS_USERNAME || '',
  STAGE: process.env.STAGE || 'dev'
} as const;

/**
 * Validates that all required AWS configuration is present
 * Throws an error if any required configuration is missing
 */
export const validateAWSConfig = (): void => {
  const requiredConfigs = [
    'APPOINTMENTS_TABLE_NAME',
    'APPOINTMENTS_TOPIC_ARN',
    'APPOINTMENTS_PE_TOPIC_ARN',
    'APPOINTMENTS_CL_TOPIC_ARN',
    'APPOINTMENTS_PE_QUEUE_URL',
    'APPOINTMENTS_CL_QUEUE_URL',
    'APPOINTMENTS_COMPLETION_QUEUE_URL',
    'EVENTBRIDGE_BUS_NAME'
  ] as const;

  const missingConfigs = requiredConfigs.filter(
    config => !AWS_CONFIG[config]
  );

  if (missingConfigs.length > 0) {
    throw new Error(
      `Missing required AWS configuration: ${missingConfigs.join(', ')}`
    );
  }
};

/**
 * Gets the SQS URL for a specific country
 */
export const getSQSUrlByCountry = (countryISO: string): string => {
  switch (countryISO) {
    case 'PE':
      return AWS_CONFIG.APPOINTMENTS_PE_QUEUE_URL;
    case 'CL':
      return AWS_CONFIG.APPOINTMENTS_CL_QUEUE_URL;
    default:
      throw new Error(`Unsupported country: ${countryISO}`);
  }
};

/**
 * Gets the SNS Topic ARN for a specific country
 */
export const getSNSTopicArnByCountry = (countryISO: string): string => {
  switch (countryISO) {
    case 'PE':
      return AWS_CONFIG.APPOINTMENTS_PE_TOPIC_ARN;
    case 'CL':
      return AWS_CONFIG.APPOINTMENTS_CL_TOPIC_ARN;
    default:
      throw new Error(`Unsupported country: ${countryISO}`);
  }
};
