import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/api-keys';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const { jobId } = params;

    // Get job details
    const job = await db.contentGenerationJob.findUnique({
      where: { id: jobId },
      include: {
        steps: {
          orderBy: { executedAt: 'asc' },
        },
        post: {
          select: {
            id: true,
            finalImageUrl: true,
            embeddedText: true,
            publicationText: true,
            hashtags: true,
            cta: true,
            status: true,
          },
        },
      },
    });

    if (!job) {
      statusCode = 404;
      return NextResponse.json(
        { 
          error: { 
            code: 'JOB_NOT_FOUND',
            message: 'Content generation job not found' 
          } 
        },
        { status: 404 }
      );
    }

    // Verify job belongs to the client associated with the API key
    const brandContext = job.brandContext as any;
    if (brandContext.clientId !== keyData.clientId) {
      statusCode = 403;
      return NextResponse.json(
        { 
          error: { 
            code: 'ACCESS_DENIED',
            message: 'Job does not belong to your client' 
          } 
        },
        { status: 403 }
      );
    }

    // Format response based on job status
    const response = {
      jobId: job.id,
      status: job.status.toLowerCase(),
      tokensConsumed: job.tokensConsumed,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      progress: calculateProgress(job.steps),
      steps: job.steps.map(step => ({
        step: step.step.toLowerCase(),
        status: step.status.toLowerCase(),
        executedAt: step.executedAt,
        error: step.error,
      })),
    };

    // Include content if job is completed
    if (job.status === 'COMPLETED' && job.post) {
      (response as any).content = {
        finalImageUrl: job.post.finalImageUrl,
        embeddedText: job.post.embeddedText,
        publicationText: job.post.publicationText,
        hashtags: job.post.hashtags,
        cta: job.post.cta,
        status: job.post.status.toLowerCase(),
      };
    }

    // Include error details if job failed
    if (job.status === 'FAILED') {
      const failedStep = job.steps.find(step => step.status === 'FAILED');
      if (failedStep) {
        (response as any).error = {
          step: failedStep.step.toLowerCase(),
          message: failedStep.error || 'Unknown error occurred',
        };
      }
    }

    statusCode = 200;
    const apiResponse = NextResponse.json({
      success: true,
      data: response,
    });

    // Log API usage
    const responseTime = Date.now() - startTime;
    await ApiKeyService.logUsage(
      keyData.id,
      `/api/external/bot/jobs/${jobId}`,
      'GET',
      statusCode,
      0,
      request.ip,
      headersList.get('user-agent'),
    );

    return apiResponse;

  } catch (error) {
    console.error('External bot job status error:', error);
    
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
        `/api/external/bot/jobs/${params.jobId}`,
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

function calculateProgress(steps: any[]): { percentage: number; currentStep: string | null } {
  if (steps.length === 0) {
    return { percentage: 0, currentStep: null };
  }

  const completedSteps = steps.filter(step => step.status === 'COMPLETED').length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  const currentStep = steps.find(step => step.status === 'IN_PROGRESS')?.step?.toLowerCase() || null;

  return { percentage, currentStep };
}