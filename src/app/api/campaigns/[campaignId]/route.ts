import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, CampaignStatus } from '@/generated/prisma';
import { db } from '@/lib/db';

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

    // Get campaign with client info
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
        posts: {
          select: {
            id: true,
            content: true,
            scheduledFor: true,
            status: true,
            platforms: true,
            createdAt: true,
          },
          orderBy: { scheduledFor: 'asc' },
        },
        _count: {
          select: {
            posts: true,
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

    return NextResponse.json({
      success: true,
      data: { campaign },
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch campaign' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Get existing campaign
    const existingCampaign = await db.campaign.findFirst({
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
            assignedUsers: {
              select: {
                id: true,
              },
            },
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

    // Check if user can access this campaign's client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      existingCampaign.client.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this campaign' } },
        { status: 403 }
      );
    }

    // Check permissions for updating
    const canEditAll = hasPermission(session.user.role as UserRole, PERMISSIONS.EDIT_ALL_CAMPAIGNS);
    const canEditAssigned = hasPermission(session.user.role as UserRole, PERMISSIONS.EDIT_ASSIGNED_CAMPAIGNS);

    if (!canEditAll && !canEditAssigned) {
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
      postsPerWeek,
      platforms,
      targetAudience,
      campaignGoals,
      brandGuidelines,
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

    // Validate status if provided
    if (status && !Object.values(CampaignStatus).includes(status)) {
      return NextResponse.json(
        { error: { message: 'Invalid campaign status' } },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) updateData.status = status;
    if (postsPerWeek !== undefined) updateData.postsPerWeek = postsPerWeek;
    if (platforms !== undefined) updateData.platforms = platforms;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience?.trim() || null;
    if (campaignGoals !== undefined) updateData.campaignGoals = campaignGoals?.trim() || null;
    if (brandGuidelines !== undefined) updateData.brandGuidelines = brandGuidelines?.trim() || null;

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
        postsPerWeek: true,
        platforms: true,
        targetAudience: true,
        campaignGoals: true,
        brandGuidelines: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'CAMPAIGN',
        resourceId: campaignId,
        details: {
          updatedFields: Object.keys(updateData),
          campaignName: updatedCampaign.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { campaign: updatedCampaign },
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to update campaign' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.DELETE_CAMPAIGNS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to delete campaigns' } },
        { status: 403 }
      );
    }

    const { campaignId } = params;

    // Get campaign to verify it belongs to the same agency
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
          },
        },
        _count: {
          select: {
            posts: true,
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

    // Check if campaign has posts
    if (campaign._count.posts > 0) {
      return NextResponse.json(
        { 
          error: { 
            message: 'Cannot delete campaign with existing posts. Please delete all posts first.' 
          } 
        },
        { status: 400 }
      );
    }

    // Delete campaign
    await db.campaign.delete({
      where: { id: campaignId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'CAMPAIGN',
        resourceId: campaignId,
        details: {
          deletedCampaign: {
            name: campaign.name,
            clientId: campaign.client.id,
            clientName: campaign.client.brandName,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Campaign deleted successfully' },
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to delete campaign' 
        } 
      },
      { status: 500 }
    );
  }
}