import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessClient } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { getCampaignJobs } from '@/lib/services/job-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { campaignId } = params;

    // Verify campaign exists and user has access
    const campaign = await db.campaign.findFirst({
      where: {
        id: campaignId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
            assignedUsers: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: { message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // Check if user can access this campaign's client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      campaign.client.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this campaign' } },
        { status: 403 }
      );
    }

    // Get jobs for this campaign
    const jobs = await getCampaignJobs(campaignId);

    // Calculate summary statistics
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'COMPLETED').length;
    const failedJobs = jobs.filter(job => job.status === 'FAILED').length;
    const inProgressJobs = jobs.filter(job => job.status === 'IN_PROGRESS').length;
    const pendingJobs = jobs.filter(job => job.status === 'PENDING').length;

    const totalCost = jobs.reduce((sum, job) => sum + job.totalCost, 0);
    const totalTokens = jobs.reduce((sum, job) => sum + job.totalTokens, 0);

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          client: campaign.client,
        },
        jobs,
        summary: {
          total: totalJobs,
          completed: completedJobs,
          failed: failedJobs,
          inProgress: inProgressJobs,
          pending: pendingJobs,
          totalCost,
          totalTokens,
        },
      },
    });
  } catch (error) {
    console.error('Get campaign jobs error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch campaign jobs' 
        } 
      },
      { status: 500 }
    );
  }
}