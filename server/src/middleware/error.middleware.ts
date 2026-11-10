import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { config } from '../config/index.js';
import { AppError } from '../utils/apiErrors.js';
import { logger } from '../lib/logger.js';

export * from '../utils/apiErrors.js';

export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req as any).id || (req.headers['x-request-id'] as string) || (res.getHeader('x-request-id') as string) || undefined;

  // 1. Handle Malformed JSON Syntax Errors from body-parser
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Bad Request',
      code: 'MALFORMED_JSON',
      message: 'Malformed JSON payload received in request body',
      ...(requestId && { requestId }),
    });
    return;
  }

  // 2. Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed on request inputs',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      ...(requestId && { requestId }),
    });
    return;
  }

  // 2. Handle Custom Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.message,
      message: err.message,
      ...(requestId && { requestId }),
    });
    return;
  }

  // 3. Handle Prisma Database Constraint Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'Conflict',
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with these unique details already exists.',
        ...(requestId && { requestId }),
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'Not Found',
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested record could not be found or was already removed.',
        ...(requestId && { requestId }),
      });
      return;
    }

    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced relational record does not exist.',
        ...(requestId && { requestId }),
      });
      return;
    }
  }

  // 4. Fallback internal server error (Sanitized)
  logger.error({ err, requestId }, 'Unhandled Application Error');

  res.status(500).json({
    success: false,
    statusCode: 500,
    error: 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred',
    ...(requestId && { requestId }),
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};
