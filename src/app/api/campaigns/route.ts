import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, CampaignStatus } from '@/generated/prisma';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('client');
    const status = searchParams.get('status') as CampaignStatus | null;

    const skip = (page - 1) * limit;

    // Build where clause based on user permissions
    let where: any = {
      client: {
        agencyId: session.user.agencyId,
      },
    };

    // If user is not owner/manager, only show campaigns for assigned clients
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.VIEW_ALL_CAMPAIGNS)) {
      where.client.assignedUsers = {
        some: {
          id: session.user.id,
        },
      };
    }

    // Filter by client if specified
    if (clientId) {
      // Check if user can access this client
      const hasAccess = await canAccessClient(
        session.user.id,
        session.user.role as UserRole,
        clientId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: { message: 'Access denied to this client' } },
          { status: 403 }
        );
      }

      where.clientId = clientId;
    }

    // Filter by status if specified
    if (status && Object.values(CampaignStatus).includes(status)) {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { brandName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get campaigns with pagination
    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
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
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch campaigns' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.CREATE_CAMPAIGNS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to create campaigns' } },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      clientId,
      startDate,
      endDate,
      status = CampaignStatus.ACTIVE,
      postsPerWeek = 3,
      platforms = [],
      targetAudience,
      campaignGoals,
      brandGuidelines,
    } = await request.json();

    // Validate required fields
    if (!name || !clientId || !startDate || !endDate) {
      return NextResponse.json(
        { error: { message: 'Name, client, start date, and end date are required' } },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return NextResponse.json(
        { error: { message: 'End date must be after start date' } },
        { status: 400 }
      );
    }

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Verify client exists and belongs to the same agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Validate status
    if (!Object.values(CampaignStatus).includes(status)) {
      return NextResponse.json(
        { error: { message: 'Invalid campaign status' } },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await db.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        clientId,
        startDate: start,
        endDate: end,
        status,
        postsPerWeek,
        platforms,
        targetAudience: targetAudience?.trim() || null,
        campaignGoals: campaignGoals?.trim() || null,
        brandGuidelines: brandGuidelines?.trim() || null,
      },
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
        action: 'CREATE',
        resource: 'CAMPAIGN',
        resourceId: campaign.id,
        details: {
          campaignName: campaign.name,
          clientId,
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { campaign },
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to create campaign' 
        } 
      },
      { status: 500 }
    );
  }
}