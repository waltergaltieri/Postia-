import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
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

    const skip = (page - 1) * limit;

    // Build where clause based on user permissions
    let where: any = {
      agencyId: session.user.agencyId,
    };

    // If user is not owner/manager, only show assigned clients
    if (session.user.role === UserRole.COLLABORATOR) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { assignedClients: { select: { id: true } } },
      });
      
      const assignedClientIds = user?.assignedClients.map(c => c.id) || [];
      where.id = { in: assignedClientIds };
    }

    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get clients with pagination
    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          brandName: true,
          contactEmail: true,
          contactPhone: true,
          industry: true,
          website: true,
          description: true,
          brandColors: true,
          brandFonts: true,
          brandVoice: true,
          targetAudience: true,
          createdAt: true,
          _count: {
            select: {
              brandAssets: true,
              campaigns: true,
            },
          },
          assignedUsers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.client.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch clients' 
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.CREATE_CLIENTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to create clients' } },
        { status: 403 }
      );
    }

    const {
      brandName,
      contactEmail,
      contactPhone,
      industry,
      website,
      description,
      brandColors,
      brandFonts,
      brandVoice,
      targetAudience,
      assignedUserIds = [],
    } = await request.json();

    // Validate required fields
    if (!brandName || !contactEmail) {
      return NextResponse.json(
        { error: { message: 'Brand name and contact email are required' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Check if client with same brand name already exists in agency
    const existingClient = await db.client.findFirst({
      where: {
        agencyId: session.user.agencyId,
        brandName: { equals: brandName, mode: 'insensitive' },
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: { message: 'A client with this brand name already exists' } },
        { status: 409 }
      );
    }

    // Validate assigned users belong to the same agency
    if (assignedUserIds.length > 0) {
      const users = await db.user.findMany({
        where: {
          id: { in: assignedUserIds },
          agencyId: session.user.agencyId,
        },
      });

      if (users.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: { message: 'Some assigned users do not exist in your agency' } },
          { status: 400 }
        );
      }
    }

    // Create client
    const client = await db.client.create({
      data: {
        brandName,
        contactEmail,
        contactPhone,
        industry,
        website,
        description,
        brandColors: brandColors || [],
        brandFonts: brandFonts || [],
        brandVoice,
        targetAudience,
        agencyId: session.user.agencyId,
        assignedUsers: {
          connect: assignedUserIds.map((id: string) => ({ id })),
        },
      },
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
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
        resource: 'CLIENT',
        resourceId: client.id,
        details: {
          brandName: client.brandName,
          assignedUsers: assignedUserIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    console.error('Create client error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to create client' 
        } 
      },
      { status: 500 }
    );
  }
}