import { NextRequest, NextResponse } from 'next/server';
import { PostiaError, ErrorCode, getErrorStatusCode, getErrorCode, isOperationalError } from '@/lib/errors';
import { log } from '@/lib/logging/logger';
import { headers } from 'next/headers';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
    timestamp: string;
  };
  success: false;
}

/**
 * Centralized error handler for API routes
 */
export class ErrorHandler {
  /**
   * Handle and format errors for API responses
   */
  static handleError(error: Error, request?: NextRequest): NextResponse<ErrorResponse> {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();
    
    // Extract request context
    const context = this.extractRequestContext(request, requestId);
    
    // Log the error
    log.logError(error, context);

    // Determine response based on error type
    if (error instanceof PostiaError) {
      return this.handlePostiaError(error, requestId, timestamp);
    }

    // Handle known error types
    if (error.name === 'PrismaClientKnownRequestError') {
      return this.handlePrismaError(error, requestId, timestamp);
    }

    if (error.name === 'ValidationError' || error.name === 'ZodError') {
      return this.handleValidationError(error, requestId, timestamp);
    }

    // Handle unexpected errors
    return this.handleUnexpectedError(error, requestId, timestamp);
  }

  /**
   * Handle PostiaError instances
   */
  private static handlePostiaError(
    error: PostiaError, 
    requestId: string, 
    timestamp: string
  ): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        requestId,
        timestamp,
      },
      success: false,
    };

    // Include additional details for operational errors
    if (error.isOperational && error.context) {
      const { userId, agencyId, clientId, ...publicContext } = error.context;
      if (Object.keys(publicContext).length > 0) {
        response.error.details = publicContext;
      }
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  /**
   * Handle Prisma database errors
   */
  private static handlePrismaError(
    error: any, 
    requestId: string, 
    timestamp: string
  ): NextResponse<ErrorResponse> {
    let message = 'Database operation failed';
    let statusCode = 500;
    let code = ErrorCode.DATABASE_ERROR;

    // Map Prisma error codes to user-friendly messages
    switch (error.code) {
      case 'P2002':
        message = 'A record with this information already exists';
        statusCode = 409;
        code = ErrorCode.RESOURCE_ALREADY_EXISTS;
        break;
      case 'P2025':
        message = 'The requested record was not found';
        statusCode = 404;
        code = ErrorCode.RESOURCE_NOT_FOUND;
        break;
      case 'P2003':
        message = 'Invalid reference to related record';
        statusCode = 400;
        code = ErrorCode.VALIDATION_ERROR;
        break;
      case 'P2014':
        message = 'The change would violate a required relation';
        statusCode = 400;
        code = ErrorCode.OPERATION_NOT_ALLOWED;
        break;
    }

    const response: ErrorResponse = {
      error: {
        code,
        message,
        requestId,
        timestamp,
      },
      success: false,
    };

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Handle validation errors
   */
  private static handleValidationError(
    error: any, 
    requestId: string, 
    timestamp: string
  ): NextResponse<ErrorResponse> {
    let message = 'Validation failed';
    let details: any = undefined;

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      message = 'Invalid input data';
      details = error.errors?.map((err: any) => ({
        field: err.path?.join('.'),
        message: err.message,
      }));
    }

    const response: ErrorResponse = {
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message,
        details,
        requestId,
        timestamp,
      },
      success: false,
    };

    return NextResponse.json(response, { status: 400 });
  }

  /**
   * Handle unexpected/unknown errors
   */
  private static handleUnexpectedError(
    error: Error, 
    requestId: string, 
    timestamp: string
  ): NextResponse<ErrorResponse> {
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response: ErrorResponse = {
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        requestId,
        timestamp,
      },
      success: false,
    };

    // Include stack trace in development
    if (isDevelopment && error.stack) {
      response.error.details = { stack: error.stack };
    }

    return NextResponse.json(response, { status: 500 });
  }

  /**
   * Extract request context for logging
   */
  private static extractRequestContext(request?: NextRequest, requestId?: string) {
    if (!request) return { requestId };

    const headersList = headers();
    
    return {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: headersList.get('user-agent'),
      ipAddress: request.ip || headersList.get('x-forwarded-for') || headersList.get('x-real-ip'),
      referer: headersList.get('referer'),
    };
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Wrapper function for API route handlers with automatic error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      const request = args[0] as NextRequest;
      return ErrorHandler.handleError(error as Error, request);
    }
  };
}

/**
 * Async wrapper that catches and handles errors
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  context?: any
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Log error with context
    log.logError(error as Error, context);
    throw error;
  }
}

/**
 * Middleware for request/response logging
 */
export function withRequestLogging(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = ErrorHandler['generateRequestId']();
    
    // Log incoming request
    log.apiRequest(request.method, new URL(request.url).pathname, {
      requestId,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.ip,
    });

    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      // Log successful response
      log.apiResponse(
        request.method,
        new URL(request.url).pathname,
        response.status,
        duration,
        { requestId }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = getErrorStatusCode(error as Error);
      
      // Log error response
      log.apiResponse(
        request.method,
        new URL(request.url).pathname,
        statusCode,
        duration,
        { requestId, error: (error as Error).message }
      );

      throw error;
    }
  };
}

/**
 * Combined middleware for error handling and request logging
 */
export function withMiddleware<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withErrorHandler(withRequestLogging(handler));
}