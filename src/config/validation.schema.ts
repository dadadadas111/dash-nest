import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  MONGODB_URI: Joi.string().required(),
  MONGODB_URI_TEST: Joi.string().optional(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_TTL: Joi.number().default(300),

  // Email
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM: Joi.string().default('noreply@taskmanagement.com'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
});
