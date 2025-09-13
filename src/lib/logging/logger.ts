import * as Sentry from '@sentry/nextjs';
import { PostiaError, ErrorContext } from '@/lib/errors';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  userId?: string;
  agencyId?: string;
  clientId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: Date;
  error?: Error;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Initialize Sentry in production
    if (this.isProduction && process.env.SENTRY_DSN) {
      this.initializeSentry();
    }
  }

  private initializeSentry() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Filter out non-operational errors in production
        if (event.exception?.values?.[0]?.type === 'PostiaError') {
          const error = event.extra?.originalError as PostiaError;
          if (error && !error.isOperational) {
            return null; // Don't send operational errors to Sentry
          }
        }
        return event;
      },
    });
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${contextStr}`;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error) {
    const logEntry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      error,
      stack: error?.stack,
    };

    // Console logging for development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(level, message, context);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, error);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, error);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedMessage, error);
          break;
      }
    }

    // Sentry logging for production
    if (this.isProduction) {
      Sentry.withScope((scope) => {
        // Set context
        if (context.userId) scope.setUser({ id: context.userId });
        if (context.agencyId) scope.setTag('agencyId', context.agencyId);
        if (context.clientId) scope.setTag('clientId', context.clientId);
        if (context.endpoint) scope.setTag('endpoint', context.endpoint);
        if (context.method) scope.setTag('method', context.method);
        if (context.requestId) scope.setTag('requestId', context.requestId);

        // Set additional context
        scope.setContext('logContext', context);
        scope.setLevel(this.mapLogLevelToSentryLevel(level));

        if (error) {
          if (level === LogLevel.FATAL || level === LogLevel.ERROR) {
            Sentry.captureException(error);
          } else {
            Sentry.captureMessage(message);
          }
        } else {
          Sentry.captureMessage(message);
        }
      });
    }

    // Store in database for audit trail (async, don't await)
    this.storeLogEntry(logEntry).catch(console.error);
  }

  private mapLogLevelToSentryLevel(level: LogLevel): Sentry.SeverityLevel {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.ERROR:
        return 'error';
      case LogLevel.FATAL:
        return 'fatal';
      default:
        return 'info';
    }
  }

  private async storeLogEntry(logEntry: LogEntry) {
    try {
      // Only store important logs in database to avoid clutter
      if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.FATAL) {
        const { db } = await import('@/lib/db');
        
        await db.systemLog.create({
          data: {
            level: logEntry.level,
            message: logEntry.message,
            context: logEntry.context,
            error: logEntry.error ? {
              name: logEntry.error.name,
              message: logEntry.error.message,
              stack: logEntry.error.stack,
            } : null,
            timestamp: logEntry.timestamp,
          },
        });
      }
    } catch (error) {
      // Fail silently to avoid logging loops
      console.error('Failed to store log entry:', error);
    }
  }

  debug(message: string, context: LogContext = {}) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: LogContext = {}) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Specialized logging methods
  apiRequest(method: string, endpoint: string, context: LogContext = {}) {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      type: 'api_request',
      method,
      endpoint,
    });
  }

  apiResponse(method: string, endpoint: string, statusCode: number, duration: number, context: LogContext = {}) {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `API Response: ${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
      ...context,
      type: 'api_response',
      method,
      endpoint,
      statusCode,
      duration,
    });
  }

  userAction(action: string, userId: string, context: LogContext = {}) {
    this.info(`User Action: ${action}`, {
      ...context,
      type: 'user_action',
      action,
      userId,
    });
  }

  systemEvent(event: string, context: LogContext = {}) {
    this.info(`System Event: ${event}`, {
      ...context,
      type: 'system_event',
      event,
    });
  }

  securityEvent(event: string, context: LogContext = {}) {
    this.warn(`Security Event: ${event}`, {
      ...context,
      type: 'security_event',
      event,
    });
  }

  performanceMetric(metric: string, value: number, unit: string, context: LogContext = {}) {
    this.info(`Performance Metric: ${metric} = ${value}${unit}`, {
      ...context,
      type: 'performance_metric',
      metric,
      value,
      unit,
    });
  }

  businessEvent(event: string, context: LogContext = {}) {
    this.info(`Business Event: ${event}`, {
      ...context,
      type: 'business_event',
      event,
    });
  }

  // Error logging with automatic context extraction
  logError(error: Error, context: LogContext = {}) {
    if (error instanceof PostiaError) {
      const errorContext = {
        ...context,
        ...error.context,
        errorCode: error.code,
        isOperational: error.isOperational,
      };

      if (error.isOperational) {
        this.warn(`Operational Error: ${error.message}`, errorContext, error);
      } else {
        this.error(`System Error: ${error.message}`, errorContext, error);
      }
    } else {
      this.error(`Unexpected Error: ${error.message}`, context, error);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext, error?: Error) => logger.warn(message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  fatal: (message: string, context?: LogContext, error?: Error) => logger.fatal(message, context, error),
  
  // Specialized methods
  apiRequest: (method: string, endpoint: string, context?: LogContext) => 
    logger.apiRequest(method, endpoint, context),
  apiResponse: (method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext) => 
    logger.apiResponse(method, endpoint, statusCode, duration, context),
  userAction: (action: string, userId: string, context?: LogContext) => 
    logger.userAction(action, userId, context),
  systemEvent: (event: string, context?: LogContext) => 
    logger.systemEvent(event, context),
  securityEvent: (event: string, context?: LogContext) => 
    logger.securityEvent(event, context),
  performanceMetric: (metric: string, value: number, unit: string, context?: LogContext) => 
    logger.performanceMetric(metric, value, unit, context),
  businessEvent: (event: string, context?: LogContext) => 
    logger.businessEvent(event, context),
  logError: (error: Error, context?: LogContext) => 
    logger.logError(error, context),
};