/**
 * Centralized error handling system for Postia SaaS Platform
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Business Logic
  INSUFFICIENT_TOKENS = 'INSUFFICIENT_TOKENS',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  SOCIAL_MEDIA_ERROR = 'SOCIAL_MEDIA_ERROR',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

export interface ErrorContext {
  userId?: string;
  agencyId?: string;
  clientId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: Date;
  [key: string]: any;
}

export class PostiaError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'PostiaError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = { ...context, timestamp: new Date() };
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, PostiaError);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Specific error classes for common scenarios
export class ValidationError extends PostiaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, context);
  }
}

export class AuthenticationError extends PostiaError {
  constructor(message: string = 'Authentication required', context: ErrorContext = {}) {
    super(ErrorCode.UNAUTHORIZED, message, 401, context);
  }
}

export class AuthorizationError extends PostiaError {
  constructor(message: string = 'Insufficient permissions', context: ErrorContext = {}) {
    super(ErrorCode.FORBIDDEN, message, 403, context);
  }
}

export class NotFoundError extends PostiaError {
  constructor(resource: string = 'Resource', context: ErrorContext = {}) {
    super(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, 404, context);
  }
}

export class ConflictError extends PostiaError {
  constructor(message: string, context: ErrorContext = {}) {
    super(ErrorCode.RESOURCE_ALREADY_EXISTS, message, 409, context);
  }
}

export class InsufficientTokensError extends PostiaError {
  constructor(required: number, available: number, context: ErrorContext = {}) {
    super(
      ErrorCode.INSUFFICIENT_TOKENS,
      `Insufficient tokens. Required: ${required}, Available: ${available}`,
      402,
      { ...context, required, available }
    );
  }
}

export class ExternalServiceError extends PostiaError {
  constructor(service: string, message: string, context: ErrorContext = {}) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} error: ${message}`,
      502,
      { ...context, service }
    );
  }
}

export class RateLimitError extends PostiaError {
  constructor(limit: number, window: string, context: ErrorContext = {}) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Limit: ${limit} requests per ${window}`,
      429,
      { ...context, limit, window }
    );
  }
}

// Error factory functions for common scenarios
export const createError = {
  validation: (message: string, context?: ErrorContext) => 
    new ValidationError(message, context),
    
  unauthorized: (message?: string, context?: ErrorContext) => 
    new AuthenticationError(message, context),
    
  forbidden: (message?: string, context?: ErrorContext) => 
    new AuthorizationError(message, context),
    
  notFound: (resource?: string, context?: ErrorContext) => 
    new NotFoundError(resource, context),
    
  conflict: (message: string, context?: ErrorContext) => 
    new ConflictError(message, context),
    
  insufficientTokens: (required: number, available: number, context?: ErrorContext) => 
    new InsufficientTokensError(required, available, context),
    
  externalService: (service: string, message: string, context?: ErrorContext) => 
    new ExternalServiceError(service, message, context),
    
  rateLimit: (limit: number, window: string, context?: ErrorContext) => 
    new RateLimitError(limit, window, context),
    
  internal: (message: string = 'Internal server error', context?: ErrorContext) => 
    new PostiaError(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, context, false),
};

// Error classification helpers
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof PostiaError) {
    return error.isOperational;
  }
  return false;
};

export const getErrorStatusCode = (error: Error): number => {
  if (error instanceof PostiaError) {
    return error.statusCode;
  }
  return 500;
};

export const getErrorCode = (error: Error): ErrorCode => {
  if (error instanceof PostiaError) {
    return error.code;
  }
  return ErrorCode.INTERNAL_SERVER_ERROR;
};