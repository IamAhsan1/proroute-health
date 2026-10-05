import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/index.js';
import { AppError } from '../utils/apiErrors.js';

export * from '../utils/apiErrors.js';

export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      error: 'Validation Error',
      message: 'Validation failed on request inputs',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.message,
      message: err.message,
    });
    return;
  }

  // Fallback internal server error
  console.error('Unhandled Application Error:', err);

  res.status(500).json({
    success: false,
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected internal server error occurred',
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

