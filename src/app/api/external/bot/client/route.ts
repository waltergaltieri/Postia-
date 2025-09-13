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
    if (!ApiKeyService.hasPermission(keyData, 'client:read')) {
      statusCode = 403;
      return NextResponse.json(
        { 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'API key does not have client read permissions' 
          } 
        },
        { status: 403 }
      );
    }

    // Get client information
    const client = await db.client.findUnique({
      where: { id: keyData.clientId },
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            tokenBalance: true,
            subscriptionPlan: true,
          },
        },
        socialMediaLinks: {
          select: {
            platform: true,
            url: true,
            username: true,
          },
        },
        socialAccounts: {
          where: { isActive: true },
          select: {
            platform: true,
            accountName: true,
            isActive: true,
          },
        },
        campaigns: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            objective: true,
            brandTone: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
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

    // Get recent content generation statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = await db.contentGenerationJob.aggregate({
      where: {
        brandContext: {
          path: ['clientId'],
          equals: client.id,
        },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      _sum: { tokensConsumed: true },
    });

    const completedJobs = await db.contentGenerationJob.count({
      where: {
        brandContext: {
          path: ['clientId'],
          equals: client.id,
        },
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    statusCode = 200;
    const response = NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          brandName: client.brandName,
          description: client.description,
          brandColors: client.brandColors,
          logoUrl: client.logoUrl,
          whatsappNumber: client.whatsappNumber,
        },
        agency: {
          name: client.agency.name,
          tokenBalance: client.agency.tokenBalance,
          subscriptionPlan: client.agency.subscriptionPlan.toLowerCase(),
        },
        socialMedia: {
          links: client.socialMediaLinks,
          connectedAccounts: client.socialAccounts.map(account => ({
            platform: account.platform.toLowerCase(),
            accountName: account.accountName,
          })),
        },
        activeCampaigns: client.campaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          objective: campaign.objective,
          brandTone: campaign.brandTone,
        })),
        statistics: {
          period: '30 days',
          totalJobs: recentJobs._count,
          completedJobs,
          tokensConsumed: recentJobs._sum.tokensConsumed || 0,
          successRate: recentJobs._count > 0 ? 
            Math.round((completedJobs / recentJobs._count) * 100) : 0,
        },
      },
    });

    // Log API usage
    const responseTime = Date.now() - startTime;
    await ApiKeyService.logUsage(
      keyData.id,
      '/api/external/bot/client',
      'GET',
      statusCode,
      0,
      request.ip,
      headersList.get('user-agent'),
    );

    return response;

  } catch (error) {
    console.error('External bot client info error:', error);
    
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
        '/api/external/bot/client',
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