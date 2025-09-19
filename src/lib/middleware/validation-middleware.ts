import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateAndSanitizeInput, createInputRateLimiter } from '../validation/input-sanitization'
import { getClientErrorMessage } from '../client-error-messages'

/**
 * Validation middleware for API routes
 */

export interface ValidationOptions {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
  headers?: z.ZodSchema
  rateLimit?: {
    maxRequests: number
    windowMs: number
    identifier?: (request: NextRequest) => string
  }
  sanitize?: boolean
}

export interface ValidatedRequest extends NextRequest {
  validatedBody?: any
  validatedQuery?: any
  validatedParams?: any
  validatedHeaders?: any
}

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware(options: ValidationOptions) {
  const rateLimiter = options.rateLimit ? createInputRateLimiter(
    options.rateLimit.maxRequests,
    options.rateLimit.windowMs
  ) : null

  return async function validationMiddleware(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<{ 
    success: boolean
    request?: ValidatedRequest
    response?: NextResponse
    error?: string
  }> {
    try {
      // Rate limiting
      if (rateLimiter && options.rateLimit) {
        const identifier = options.rateLimit.identifier 
          ? options.rateLimit.identifier(request)
          : request.ip || 'unknown'
        
        if (!rateLimiter(identifier)) {
          return {
            success: false,
            response: NextResponse.json(
              { 
                success: false, 
                error: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
              },
              { status: 429 }
            )
          }
        }
      }

      const validatedRequest = request as ValidatedRequest

      // Validate request body
      if (options.body) {
        try {
          const body = await request.json()
          
          if (options.sanitize) {
            validatedRequest.validatedBody = validateAndSanitizeInput(
              body,
              options.body.parse.bind(options.body)
            )
          } else {
            validatedRequest.validatedBody = options.body.parse(body)
          }
        } catch (error) {
          return {
            success: false,
            response: NextResponse.json(
              {
                success: false,
                error: 'Invalid request body',
                details: error instanceof z.ZodError ? error.errors : undefined,
                code: 'VALIDATION_ERROR'
              },
              { status: 400 }
            )
          }
        }
      }

      // Validate query parameters
      if (options.query) {
        try {
          const url = new URL(request.url)
          const queryParams = Object.fromEntries(url.searchParams.entries())
          
          if (options.sanitize) {
            validatedRequest.validatedQuery = validateAndSanitizeInput(
              queryParams,
              options.query.parse.bind(options.query)
            )
          } else {
            validatedRequest.validatedQuery = options.query.parse(queryParams)
          }
        } catch (error) {
          return {
            success: false,
            response: NextResponse.json(
              {
                success: false,
                error: 'Invalid query parameters',
                details: error instanceof z.ZodError ? error.errors : undefined,
                code: 'VALIDATION_ERROR'
              },
              { status: 400 }
            )
          }
        }
      }

      // Validate route parameters
      if (options.params && context?.params) {
        try {
          if (options.sanitize) {
            validatedRequest.validatedParams = validateAndSanitizeInput(
              context.params,
              options.params.parse.bind(options.params)
            )
          } else {
            validatedRequest.validatedParams = options.params.parse(context.params)
          }
        } catch (error) {
          return {
            success: false,
            response: NextResponse.json(
              {
                success: false,
                error: 'Invalid route parameters',
                details: error instanceof z.ZodError ? error.errors : undefined,
                code: 'VALIDATION_ERROR'
              },
              { status: 400 }
            )
          }
        }
      }

      // Validate headers
      if (options.headers) {
        try {
          const headers = Object.fromEntries(request.headers.entries())
          
          if (options.sanitize) {
            validatedRequest.validatedHeaders = validateAndSanitizeInput(
              headers,
              options.headers.parse.bind(options.headers)
            )
          } else {
            validatedRequest.validatedHeaders = options.headers.parse(headers)
          }
        } catch (error) {
          return {
            success: false,
            response: NextResponse.json(
              {
                success: false,
                error: 'Invalid request headers',
                details: error instanceof z.ZodError ? error.errors : undefined,
                code: 'VALIDATION_ERROR'
              },
              { status: 400 }
            )
          }
        }
      }

      return {
        success: true,
        request: validatedRequest
      }
    } catch (error) {
      console.error('Validation middleware error:', error)
      
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Internal validation error',
            code: 'INTERNAL_ERROR'
          },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * Higher-order function to wrap API route handlers with validation
 */
export function withValidation<T = any>(
  options: ValidationOptions,
  handler: (request: ValidatedRequest, context?: { params?: any }) => Promise<NextResponse>
) {
  const middleware = createValidationMiddleware(options)

  return async function validatedHandler(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<NextResponse> {
    const validation = await middleware(request, context)
    
    if (!validation.success) {
      return validation.response!
    }
    
    try {
      return await handler(validation.request!, context)
    } catch (error) {
      console.error('API handler error:', error)
      
      // Handle client-specific errors
      if (error instanceof Error && (
        error.name === 'ClientAccessError' ||
        error.name === 'ClientPermissionError' ||
        error.name === 'ClientDataIsolationError'
      )) {
        const errorMessage = getClientErrorMessage(error)
        
        return NextResponse.json(
          {
            success: false,
            error: errorMessage.description,
            title: errorMessage.title,
            action: errorMessage.action,
            code: error.name.toUpperCase()
          },
          { status: error.name === 'ClientPermissionError' ? 403 : 401 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Validation middleware specifically for client-related operations
 */
export function withClientValidation(
  options: Omit<ValidationOptions, 'rateLimit'> & {
    requireClientAccess?: boolean
    requiredPermissions?: string[]
    rateLimit?: boolean
  }
) {
  const validationOptions: ValidationOptions = {
    ...options,
    rateLimit: options.rateLimit ? {
      maxRequests: 100,
      windowMs: 60000,
      identifier: (request) => {
        // Use client ID + user ID for rate limiting
        const clientId = request.headers.get('x-client-id') || 'unknown'
        const userId = request.headers.get('x-user-id') || request.ip || 'unknown'
        return `${clientId}:${userId}`
      }
    } : undefined,
    sanitize: true
  }

  return withValidation(validationOptions, async (request, context) => {
    // Additional client-specific validation logic would go here
    // For now, we'll just pass through to the original handler
    throw new Error('Handler must be provided')
  })
}

/**
 * Common validation schemas for client operations
 */
export const commonValidationSchemas = {
  clientId: z.string().min(1, 'Client ID is required'),
  
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),
  
  search: z.object({
    query: z.string().max(100).optional(),
    filters: z.record(z.string()).optional()
  }),
  
  clientHeaders: z.object({
    'x-client-id': z.string().optional(),
    'x-user-id': z.string().optional(),
    'authorization': z.string().optional()
  })
}

/**
 * Error response helpers
 */
export function createValidationErrorResponse(
  error: z.ZodError,
  message: string = 'Validation failed'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })),
      code: 'VALIDATION_ERROR'
    },
    { status: 400 }
  )
}

export function createClientErrorResponse(
  error: Error,
  statusCode: number = 400
): NextResponse {
  const errorMessage = getClientErrorMessage(error)
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage.description,
      title: errorMessage.title,
      action: errorMessage.action,
      severity: errorMessage.severity,
      code: error.name.toUpperCase()
    },
    { status: statusCode }
  )
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  metadata?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    metadata,
    timestamp: new Date().toISOString()
  })
}

/**
 * Request logging middleware
 */
export function withRequestLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async function loggedHandler(
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[${requestId}] ${request.method} ${request.url}`)
    
    try {
      const response = await handler(request, context)
      const duration = Date.now() - startTime
      
      console.log(`[${requestId}] ${response.status} - ${duration}ms`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${requestId}] Error - ${duration}ms:`, error)
      throw error
    }
  }
}

/**
 * Combined middleware for comprehensive API protection
 */
export function withApiProtection(
  validationOptions: ValidationOptions,
  handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRequestLogging(
    withValidation(validationOptions, handler)
  )
}