import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { isProd } from '../config/env';
import { ZodError } from 'zod';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Keep this as the LAST middleware registered in app.ts
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errors: unknown[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof Error) {
    message = isProd ? 'Something went wrong' : err.message;
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Please check the product details and try again.';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.') || 'form',
      message: issue.message
    }));
  }

  // Mongoose duplicate key error
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, message);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(isProd ? {} : { stack: err instanceof Error ? err.stack : undefined })
  });
}
