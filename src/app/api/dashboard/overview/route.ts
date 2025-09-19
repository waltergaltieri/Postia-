import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { withErrorHandler } from '@/lib/middleware/error-handler';

async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Check permissions
  if (!hasPermission(session.user.role as UserRole, PERMISSIONS.VIEW_CAMPAIGNS)) {
    return NextResponse.json(
      { error: { message: 'Insufficient permissions to view dashboard' } },
      { status: 403 }
    );
  }

  try {
    const agencyId = session.user.agencyId;

    // Get agency information
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: {
        users: {
          select: { id: true },
        },
        clients: {
          select: { id: true },
        },
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: { message: 'Agency not found' } },
        { status: 404 }
      );
    }

    // Get campaign statistics
    const [activeCampaigns, completedCampaigns] = await Promise.all([
      db.campaign.count({
        where: {
          client: { agencyId },
          status: 'ACTIVE',
        },
      }),
      db.campaign.count({
        where: {
          client: { agencyId },
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Get post statistics
    const [totalPosts, publishedPosts] = await Promise.all([
      db.post.count({
        where: {
          campaign: {
            client: { agencyId },
          },
        },
      }),
      db.post.count({
        where: {
          campaign: {
            client: { agencyId },
          },
          status: 'PUBLISHED',
        },
      }),
    ]);

    // Get content generation statistics for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [contentJobs, tokenTransactions] = await Promise.all([
      db.contentGenerationJob.findMany({
        where: {
          brandContext: {
            path: ['agencyId'],
            equals: agencyId,
          },
          createdAt: { gte: startOfMonth },
        },
        select: {
          id: true,
          status: true,
          tokensConsumed: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      db.tokenTransaction.aggregate({
        where: {
          agencyId,
          type: 'CONSUMPTION',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate content generation metrics
    const completedJobs = contentJobs.filter(job => job.status === 'COMPLETED');
    const successRate = contentJobs.length > 0 ? 
      Math.round((completedJobs.length / contentJobs.length) * 100) : 0;

    const averageCompletionTime = completedJobs.length > 0 ?
      completedJobs.reduce((sum, job) => {
        if (job.completedAt) {
          return sum + (new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime());
        }
        return sum;
      }, 0) / completedJobs.length / 1000 : 0; // Convert to seconds

    // Get recent activity (audit logs)
    const recentActivity = await db.auditLog.findMany({
      where: { agencyId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get upcoming posts
    const upcomingPosts = await db.post.findMany({
      where: {
        campaign: {
          client: { agencyId },
        },
        scheduledDate: {
          gte: new Date(),
        },
        status: {
          in: ['DRAFT', 'APPROVED'],
        },
      },
      take: 10,
      orderBy: { scheduledDate: 'asc' },
      include: {
        campaign: {
          select: {
            name: true,
            client: {
              select: {
                brandName: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const dashboardStats = {
      agency: {
        name: agency.name,
        subscriptionPlan: agency.subscriptionPlan,
        tokenBalance: agency.tokenBalance,
        userCount: agency.users.length,
        clientCount: agency.clients.length,
      },
      campaigns: {
        active: activeCampaigns,
        completed: completedCampaigns,
        totalPosts,
        publishedPosts,
      },
      contentGeneration: {
        jobsThisMonth: contentJobs.length,
        tokensConsumedThisMonth: Math.abs(tokenTransactions._sum.amount || 0),
        successRate,
        averageCompletionTime,
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.action.toLowerCase(),
        description: formatActivityDescription(activity.action, activity.resource, activity.details),
        timestamp: activity.createdAt,
        user: activity.user?.name,
      })),
      upcomingPosts: upcomingPosts.map(post => ({
        id: post.id,
        campaignName: post.campaign.name,
        clientName: post.campaign.client.brandName,
        scheduledDate: post.scheduledDate,
        status: post.status.toLowerCase(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch dashboard data' 
        } 
      },
      { status: 500 }
    );
  }
}

function formatActivityDescription(action: string, resource: string, details: any): string {
  const resourceName = resource.toLowerCase().replace('_', ' ');
  
  switch (action) {
    case 'CREATE':
      return `Created new ${resourceName}`;
    case 'UPDATE':
      return `Updated ${resourceName}`;
    case 'DELETE':
      return `Deleted ${resourceName}`;
    case 'LOGIN':
      return 'Logged in';
    case 'LOGOUT':
      return 'Logged out';
    case 'CONTENT_GENERATED':
      return 'Generated content';
    case 'CONTENT_PUBLISHED':
      return 'Published content';
    case 'USER_INVITED':
      return `Invited new user`;
    case 'CAMPAIGN_CREATED':
      return `Created campaign: ${details?.name || 'Untitled'}`;
    case 'CLIENT_CREATED':
      return `Added client: ${details?.brandName || 'New Client'}`;
    case 'TOKENS_PURCHASED':
      return `Purchased ${details?.tokensAdded || 0} tokens`;
    case 'SUBSCRIPTION_ACTIVATED':
      return `Activated ${details?.plan || 'subscription'} plan`;
    default:
      return `${action.toLowerCase().replace('_', ' ')} ${resourceName}`;
  }
}

export { GET };