import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyService } from '@/lib/services/api-keys';
import { TokenConsumptionService } from '@/lib/services/token-consumption';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const apiKey = authorization.substring(7); // Remove 'Bearer '
    
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
    if (!ApiKeyService.hasPermission(keyData, 'content:generate')) {
      statusCode = 403;
      return NextResponse.json(
        { 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'API key does not have content generation permissions' 
          } 
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      prompt, 
      contentType = 'social_post',
      platforms = ['instagram'],
      includeImages = true,
      urgency = 'normal',
      metadata = {}
    } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      statusCode = 400;
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_PROMPT',
            message: 'Prompt is required and must be a non-empty string' 
          } 
        },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      statusCode = 400;
      return NextResponse.json(
        { 
          error: { 
            code: 'PROMPT_TOO_LONG',
            message: 'Prompt must be less than 2000 characters' 
          } 
        },
        { status: 400 }
      );
    }

    // Get client and agency information
    const client = await db.client.findUnique({
      where: { id: keyData.clientId },
      include: {
        agency: {
          select: {
            id: true,
            tokenBalance: true,
            subscriptionPlan: true,
          },
        },
        brandAssets: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        socialMediaLinks: true,
      },
    });

    if (!client) {
      statusCode = 404;
      return NextResponse.json(
        { 
          error: { 
            code: 'CLIENT_NOT_FOUND',
            message: 'Client associated with API key not found' 
          } 
        },
        { status: 404 }
      );
    }

    // Estimate token cost using standardized step names
    const steps = ['IDEA_GENERATION', 'COPY_DESIGN', 'COPY_PUBLICATION'];
    if (includeImages) {
      steps.push('BASE_IMAGE', 'FINAL_DESIGN');
    }

    const estimatedTokens = TokenConsumptionService.calculateJobTokens(steps);

    // Check token balance
    const hasBalance = await TokenConsumptionService.checkTokenBalance(
      client.agency.id,
      estimatedTokens
    );

    if (!hasBalance) {
      statusCode = 402; // Payment Required
      return NextResponse.json(
        { 
          error: { 
            code: 'INSUFFICIENT_TOKENS',
            message: 'Insufficient token balance for content generation',
            details: {
              required: estimatedTokens,
              available: client.agency.tokenBalance,
            }
          } 
        },
        { status: 402 }
      );
    }

    // Create content generation job
    const job = await db.contentGenerationJob.create({
      data: {
        status: 'PENDING',
        tokensConsumed: 0,
        brandContext: {
          clientId: client.id,
          brandName: client.brandName,
          brandColors: client.brandColors,
          description: client.description,
          socialMediaLinks: client.socialMediaLinks,
          brandAssets: client.brandAssets.map(asset => ({
            type: asset.type,
            name: asset.name,
            url: asset.url,
          })),
          externalPrompt: prompt,
          contentType,
          platforms,
          includeImages,
          urgency,
          metadata,
          source: 'external_bot',
          apiKeyId: keyData.id,
        },
      },
    });

    // Queue the job for processing (in a real implementation, this would use a job queue)
    // For now, we'll return the job ID and process it asynchronously
    
    statusCode = 202; // Accepted
    const response = NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          status: 'accepted',
          estimatedTokens,
          estimatedCompletionTime: calculateEstimatedTime(urgency, includeImages),
          message: 'Content generation job created successfully',
        },
      },
      { status: 202 }
    );

    // Log API usage
    const responseTime = Date.now() - startTime;
    await ApiKeyService.logUsage(
      keyData.id,
      '/api/external/bot/generate',
      'POST',
      statusCode,
      0, // Tokens will be consumed during actual processing
      request.ip,
      headersList.get('user-agent'),
    );

    return response;

  } catch (error) {
    console.error('External bot generate error:', error);
    
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
        '/api/external/bot/generate',
        'POST',
        statusCode,
        0,
        request.ip,
        headers().get('user-agent'),
      );
    }

    return response;
  }
}

function calculateEstimatedTime(urgency: string, includeImages: boolean): string {
  let baseTime = includeImages ? 180 : 60; // seconds
  
  switch (urgency) {
    case 'high':
      baseTime *= 0.7;
      break;
    case 'low':
      baseTime *= 1.5;
      break;
    default: // normal
      break;
  }

  const minutes = Math.ceil(baseTime / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}