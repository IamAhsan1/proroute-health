import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { config } from '../config/index.js';

const isDev = config.NODE_ENV === 'development';
const isTest = config.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : isDev ? 'debug' : 'info',
  redact: {
    paths: [
      'password',
      'newPassword',
      'currentPassword',
      'token',
      'refreshToken',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  ...(isDev && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: !isTest,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
