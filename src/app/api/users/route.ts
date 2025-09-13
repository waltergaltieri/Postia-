import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
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

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to view users' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      agencyId: session.user.agencyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          assignedClients: {
            select: {
              id: true,
              brandName: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch users' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to update users' } },
        { status: 403 }
      );
    }

    const { userId, role, clientIds } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: { message: 'User ID is required' } },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    // Only owners can change roles to owner
    if (role === UserRole.OWNER && session.user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: { message: 'Only owners can assign owner role' } },
        { status: 403 }
      );
    }

    // Get user to verify they belong to the same agency
    const user = await db.user.findFirst({
      where: {
        id: userId,
        agencyId: session.user.agencyId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    // Prevent users from changing their own role
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: { message: 'Cannot change your own role' } },
        { status: 400 }
      );
    }

    // Update user
    const updateData: any = {};
    if (role) updateData.role = role;
    
    if (clientIds !== undefined) {
      updateData.assignedClients = {
        set: clientIds.map((id: string) => ({ id })),
      };
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        assignedClients: {
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
        resource: 'USER',
        resourceId: userId,
        details: {
          updatedFields: Object.keys(updateData),
          newRole: role,
          assignedClients: clientIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to update user' 
        } 
      },
      { status: 500 }
    );
  }
}