import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, CampaignStatus } from '@/generated/prisma';
import { db } from '@/lib/db';
import { 
  withOptionalClientIsolation, 
  NextRequestWithClientContext,
  createClientIsolatedQueries,
  requireUserContext
} from '@/lib/middleware/client-isolation';

async function handleGET(
  request: NextRequestWithClientContext,
  { params }: { params: { campaignId: string } }
) {
  const userContext = requireUserContext(request);
  const clientQueries = createClientIsolatedQueries(request);
  
  if (!clientQueries) {
    return NextResponse.json(
      { error: { message: 'Failed to create client context' } },
      { status: 500 }
    );
  }

  const { campaignId } = params;

  // Get campaign with client filtering
  const campaign = await db.campaign.findFirst({
    where: {
      id: campaignId,
      agencyId: userContext.agencyId,
      ...clientQueries.getClientFilter(),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      jobs: {
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          jobs: true,
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

  // Additional client access check
  if (!clientQueries.canAccessClient(campaign.client.id)) {
    return NextResponse.json(
      { error: { message: 'Access denied to this campaign' } },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { campaign },
  });
}

async function handlePATCH(
  request: NextRequestWithClientContext,
  { params }: { params: { campaignId: string } }
) {
  const userContext = requireUserContext(request);
  const clientQueries = createClientIsolatedQueries(request);
  
  if (!clientQueries) {
    return NextResponse.json(
      { error: { message: 'Failed to create client context' } },
      { status: 500 }
    );
  }

  const { campaignId } = params;

  // Get existing campaign with client filtering
  const existingCampaign = await db.campaign.findFirst({
    where: {
      id: campaignId,
      agencyId: userContext.agencyId,
      ...clientQueries.getClientFilter(),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existingCampaign) {
    return NextResponse.json(
      { error: { message: 'Campaign not found' } },
      { status: 404 }
    );
  }

  // Check client access
  if (!clientQueries.canAccessClient(existingCampaign.client.id)) {
    return NextResponse.json(
      { error: { message: 'Access denied to this campaign' } },
      { status: 403 }
    );
  }

  // Check permissions for updating
  const canEdit = hasPermission(userContext.role, PERMISSIONS.EDIT_ALL_CAMPAIGNS) ||
                  hasPermission(userContext.role, PERMISSIONS.EDIT_ASSIGNED_CAMPAIGNS);

  if (!canEdit) {
    return NextResponse.json(
      { error: { message: 'Insufficient permissions to update campaigns' } },
      { status: 403 }
    );
  }

  const {
    name,
    description,
    startDate,
    endDate,
    status,
    settings,
  } = await request.json();

  // Validate dates if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return NextResponse.json(
        { error: { message: 'End date must be after start date' } },
        { status: 400 }
      );
    }
  }

  // Build update data
  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (startDate !== undefined) updateData.startDate = new Date(startDate);
  if (endDate !== undefined) updateData.endDate = new Date(endDate);
  if (status !== undefined) updateData.status = status;
  if (settings !== undefined) updateData.settings = settings ? JSON.stringify(settings) : null;

  // Update campaign
  const updatedCampaign = await db.campaign.update({
    where: { id: campaignId },
    data: updateData,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      settings: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: { campaign: updatedCampaign },
  });
}

async function handleDELETE(
  request: NextRequestWithClientContext,
  { params }: { params: { campaignId: string } }
) {
  const userContext = requireUserContext(request);
  const clientQueries = createClientIsolatedQueries(request);
  
  if (!clientQueries) {
    return NextResponse.json(
      { error: { message: 'Failed to create client context' } },
      { status: 500 }
    );
  }

  // Check permissions
  if (!hasPermission(userContext.role, PERMISSIONS.DELETE_CAMPAIGNS)) {
    return NextResponse.json(
      { error: { message: 'Insufficient permissions to delete campaigns' } },
      { status: 403 }
    );
  }

  const { campaignId } = params;

  // Get campaign with client filtering
  const campaign = await db.campaign.findFirst({
    where: {
      id: campaignId,
      agencyId: userContext.agencyId,
      ...clientQueries.getClientFilter(),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          jobs: true,
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

  // Check client access
  if (!clientQueries.canAccessClient(campaign.client.id)) {
    return NextResponse.json(
      { error: { message: 'Access denied to this campaign' } },
      { status: 403 }
    );
  }

  // Check if campaign has jobs
  if (campaign._count.jobs > 0) {
    return NextResponse.json(
      { 
        error: { 
          message: 'Cannot delete campaign with existing jobs. Please wait for jobs to complete or cancel them first.' 
        } 
      },
      { status: 400 }
    );
  }

  // Delete campaign
  await db.campaign.delete({
    where: { id: campaignId },
  });

  return NextResponse.json({
    success: true,
    data: { message: 'Campaign deleted successfully' },
  });
}

// Export handlers with client isolation middleware
export const GET = withOptionalClientIsolation(handleGET);
export const PATCH = withOptionalClientIsolation(handlePATCH);
export const DELETE = withOptionalClientIsolation(handleDELETE);