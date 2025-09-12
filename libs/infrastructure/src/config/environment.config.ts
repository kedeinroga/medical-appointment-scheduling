import { AWS_CONFIG } from './aws.config';

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  aws: {
    appointmentsTableName: string;
    appointmentsTopicArn: string;
    eventBridgeBusName: string;
    region: string;
  };
  database: {
    host: string;
    password: string;
    port: number;
    username: string;
  };
  logging: {
    level: string;
    retentionDays: number;
  };
  stage: 'dev' | 'staging' | 'prod';
}

/**
 * Gets environment configuration with type safety and validation
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  validateEnvironmentConfig();

  return {
    aws: {
      appointmentsTableName: AWS_CONFIG.APPOINTMENTS_TABLE_NAME,
      appointmentsTopicArn: AWS_CONFIG.APPOINTMENTS_TOPIC_ARN,
      eventBridgeBusName: AWS_CONFIG.EVENTBRIDGE_BUS_NAME,
      region: AWS_CONFIG.AWS_REGION
    },
    database: {
      host: AWS_CONFIG.RDS_HOST,
      password: AWS_CONFIG.RDS_PASSWORD,
      port: AWS_CONFIG.RDS_PORT,
      username: AWS_CONFIG.RDS_USERNAME
    },
    logging: {
      level: process.env.LOG_LEVEL || 'INFO',
      retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '7')
    },
    stage: (AWS_CONFIG.STAGE as 'dev' | 'staging' | 'prod') || 'dev'
  };
};

/**
 * Validates that all required environment configuration is present
 */
export const validateEnvironmentConfig = (): void => {
  const requiredEnvVars = [
    'APPOINTMENTS_TABLE_NAME',
    'APPOINTMENTS_TOPIC_ARN',
    'EVENTBRIDGE_BUS_NAME',
    'RDS_HOST',
    'RDS_USERNAME',
    'RDS_PASSWORD'
  ] as const;

  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

/**
 * Gets stage-specific configuration
 */
export const getStageConfig = () => {
  const stage = AWS_CONFIG.STAGE;
  
  const stageConfigs = {
    dev: {
      logLevel: 'DEBUG',
      retentionDays: 3
    },
    prod: {
      logLevel: 'INFO',
      retentionDays: 30
    },
    staging: {
      logLevel: 'INFO',
      retentionDays: 7
    }
  };

  return stageConfigs[stage as keyof typeof stageConfigs] || stageConfigs.dev;
};

/**
 * Checks if the current environment is production
 */
export const isProduction = (): boolean => {
  return AWS_CONFIG.STAGE === 'prod';
};

/**
 * Checks if the current environment is development
 */
export const isDevelopment = (): boolean => {
  return AWS_CONFIG.STAGE === 'dev';
};

/**
 * Gets feature flags for the current environment
 */
export const getFeatureFlags = () => {
  return {
    enableDebugLogging: isDevelopment(),
    enableDetailedMetrics: isProduction(),
    enableSensitiveDataMasking: true
  };
};
