import { Response } from 'express';

/**
 * Standardized API Response Envelope for all ProRoute responses.
 */
export class ApiResponse<T = any> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data?: T;

  constructor(statusCode = 200, data?: T, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  public send(res: Response): void {
    res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    });
  }

  public static success<T>(res: Response, data?: T, message = 'Success', statusCode = 200): void {
    new ApiResponse(statusCode, data, message).send(res);
  }

  public static created<T>(
    res: Response,
    data?: T,
    message = 'Resource created successfully'
  ): void {
    new ApiResponse(201, data, message).send(res);
  }
}
