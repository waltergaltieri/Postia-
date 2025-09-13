import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/api-keys';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let apiKeyId: string | undefined;
  let statusCode = 500;

  try {
    // Get API key from Authorization header
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      statusCode = 401;
      return NextResponse.json(
        { 
          error: { 
            code: 'UNAUTHORIZED',
            message: 'API key required. Use Authorization: Bearer <api_key>' 
          } 
        },
        { status: 401 }
      );
    }

    const apiKey = authorization.substring(7);
    
    // Validate API key
    const keyData = await ApiKeyService.validateApiKey(apiKey);
    if (!keyData) {
      statusCode = 401;
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_API_KEY',
            message: 'Invalid or expired API key' 
          } 
        },
        { status: 401 }
      );
    }

    apiKeyId = keyData.id;

    // Check permissions
    if (!ApiKeyService.hasPermission(keyData, 'content:read')) {
      statusCode = 403;
      return NextResponse.json(
        { 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'API key does not have content read permissions' 
          } 
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 'pending', 'in_progress', 'completed', 'failed'

    // Build where clause
    const where: any = {};
    
    // Filter by client ID from API key
    where.brandContext = {
      path: ['clientId'],
      equals: keyData.clientId,
    };

    // Filter by status if provided
    if (status) {
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'in_progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
        'failed': 'FAILED',
      };
      
      if (statusMap[status]) {
        where.status = statusMap[status];
      }
    }

    // Get jobs with pagination
    const [jobs, totalCount] = await Promise.all([
      db.contentGenerationJob.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          steps: {
            select: {
              step: true,
              status: true,
              executedAt: true,
            },
            orderBy: { executedAt: 'asc' },
          },
          post: {
            select: {
              id: true,
              status: true,
              finalImageUrl: true,
            },
          },
        },
      }),
      db.contentGenerationJob.count({ where }),
    ]);

    // Format response
    const formattedJobs = jobs.map(job => {
      const brandContext = job.brandContext as any;
      const completedSteps = job.steps.filter(step => step.status === 'COMPLETED').length;
      const totalSteps = job.steps.length;
      const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return {
        jobId: job.id,
        status: job.status.toLowerCase(),
        tokensConsumed: job.tokensConsumed,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        progress: {
          percentage: progress,
          completedSteps,
          totalSteps,
        },
        prompt: brandContext.externalPrompt || null,
        contentType: brandContext.contentType || 'social_post',
        platforms: brandContext.platforms || [],
        includeImages: brandContext.includeImages || false,
        hasContent: job.status === 'COMPLETED' && !!job.post,
      };
    });

    statusCode = 200;
    const response = NextResponse.json({
      success: true,
      data: {
        jobs: formattedJobs,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
        },
      },
    });

    // Log API usage
    const responseTime = Date.now() - startTime;
    await ApiKeyService.logUsage(
      keyData.id,
      '/api/external/bot/jobs',
      'GET',
      statusCode,
      0,
      request.ip,
      headersList.get('user-agent'),
    );

    return response;

  } catch (error) {
    console.error('External bot jobs list error:', error);
    
    statusCode = 500;
    const response = NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR',
          message: 'Internal server error occurred' 
        } 
      },
      { status: 500 }
    );

    // Log failed request
    if (apiKeyId) {
      const responseTime = Date.now() - startTime;
      await ApiKeyService.logUsage(
        apiKeyId,
        '/api/external/bot/jobs',
        'GET',
        statusCode,
        0,
        request.ip,
        headers().get('user-agent'),
      );
    }

    return response;
  }
}