import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandler } from '../error.middleware.js';
import { NotFoundError, BadRequestError } from '../../utils/apiErrors.js';

describe('Global Error Handler Middleware', () => {
  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.statusCode = 200;
    res.status = vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = vi.fn().mockImplementation((body: any) => {
      (res as any).body = body;
      return res;
    });
    res.getHeader = vi.fn().mockReturnValue('req-test-12345');
    return res as Response & { body: any };
  };

  const mockReq = {
    id: 'req-test-12345',
    headers: { 'x-request-id': 'req-test-12345' },
  } as unknown as Request;

  const next = vi.fn();

  it('should format ZodError into 400 Bad Request with field details and requestId', () => {
    const res = createMockRes();
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: ['email'],
        message: 'Email is required',
      },
    ]);

    errorHandler(zodError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toEqual([{ field: 'email', message: 'Email is required' }]);
    expect(res.body.requestId).toBe('req-test-12345');
  });

  it('should format malformed JSON syntax errors from body-parser into 400 Bad Request', () => {
    const res = createMockRes();
    const syntaxError = new SyntaxError('Unexpected token in JSON');
    (syntaxError as any).body = '{malformed';

    errorHandler(syntaxError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.code).toBe('MALFORMED_JSON');
    expect(res.body.requestId).toBe('req-test-12345');
  });

  it('should format custom operational AppError correctly', () => {
    const res = createMockRes();
    const appError = new NotFoundError('Doctor profile not found');

    errorHandler(appError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.message).toBe('Doctor profile not found');
    expect(res.body.requestId).toBe('req-test-12345');
  });

  it('should map Prisma P2002 unique constraint violation to 409 Conflict', () => {
    const res = createMockRes();
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });

    errorHandler(prismaError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_RESOURCE');
    expect(res.body.message).toContain('already exists');
    expect(res.body.requestId).toBe('req-test-12345');
  });

  it('should map Prisma P2025 record not found to 404 Not Found', () => {
    const res = createMockRes();
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });

    errorHandler(prismaError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
    expect(res.body.requestId).toBe('req-test-12345');
  });

  it('should map Prisma P2003 foreign key violation to 400 Bad Request', () => {
    const res = createMockRes();
    const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '5.0.0',
    });

    errorHandler(prismaError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.code).toBe('FOREIGN_KEY_VIOLATION');
    expect(res.body.requestId).toBe('req-test-12345');
  });

  it('should sanitize unexpected errors and return 500 Internal Server Error without leaking internal message', () => {
    const res = createMockRes();
    const unexpectedError = new Error('DATABASE_SECRET_PASSWORD_CRASH');

    errorHandler(unexpectedError, mockReq, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(500);
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.message).toBe('An unexpected internal server error occurred');
    expect(res.body.requestId).toBe('req-test-12345');
  });
});
