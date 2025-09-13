import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, PostStatus, SocialPlatform } from '@/generated/prisma';
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as PostStatus | null;
    const platform = searchParams.get('platform') as SocialPlatform | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

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

    // Build where clause
    const where: any = {
      campaignId,
    };

    if (status && Object.values(PostStatus).includes(status)) {
      where.status = status;
    }

    if (platform && Object.values(SocialPlatform).includes(platform)) {
      where.platforms = {
        has: platform,
      };
    }

    if (startDate || endDate) {
      where.scheduledFor = {};
      if (startDate) where.scheduledFor.gte = new Date(startDate);
      if (endDate) where.scheduledFor.lte = new Date(endDate);
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledFor: 'asc' },
        select: {
          id: true,
          content: true,
          scheduledFor: true,
          status: true,
          platforms: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get campaign posts error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch campaign posts' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Check permissions for creating posts
    const canCreateAll = hasPermission(session.user.role as UserRole, PERMISSIONS.EDIT_ALL_CAMPAIGNS);
    const canCreateAssigned = hasPermission(session.user.role as UserRole, PERMISSIONS.EDIT_ASSIGNED_CAMPAIGNS);

    if (!canCreateAll && !canCreateAssigned) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to create posts' } },
        { status: 403 }
      );
    }

    const {
      content,
      scheduledFor,
      platforms = [],
      imageUrl,
      status = PostStatus.DRAFT,
    } = await request.json();

    // Validate required fields
    if (!content || !scheduledFor || platforms.length === 0) {
      return NextResponse.json(
        { error: { message: 'Content, scheduled date, and at least one platform are required' } },
        { status: 400 }
      );
    }

    // Validate scheduled date
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate < campaign.startDate || scheduledDate > campaign.endDate) {
      return NextResponse.json(
        { error: { message: 'Scheduled date must be within campaign date range' } },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms = platforms.filter((platform: string) => 
      Object.values(SocialPlatform).includes(platform as SocialPlatform)
    );

    if (validPlatforms.length !== platforms.length) {
      return NextResponse.json(
        { error: { message: 'Invalid social media platforms specified' } },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(PostStatus).includes(status)) {
      return NextResponse.json(
        { error: { message: 'Invalid post status' } },
        { status: 400 }
      );
    }

    // Create post
    const post = await db.post.create({
      data: {
        campaignId,
        clientId: campaign.client.id,
        content: content.trim(),
        scheduledFor: scheduledDate,
        platforms: validPlatforms,
        imageUrl: imageUrl?.trim() || null,
        status,
      },
      select: {
        id: true,
        content: true,
        scheduledFor: true,
        status: true,
        platforms: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'POST',
        resourceId: post.id,
        details: {
          campaignId,
          clientId: campaign.client.id,
          scheduledFor: post.scheduledFor.toISOString(),
          platforms: post.platforms,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error('Create post error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to create post' 
        } 
      },
      { status: 500 }
    );
  }
}