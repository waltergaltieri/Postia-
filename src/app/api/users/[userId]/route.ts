import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to delete users' } },
        { status: 403 }
      );
    }

    const { userId } = params;

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

    // Prevent users from deleting themselves
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: { message: 'Cannot delete your own account' } },
        { status: 400 }
      );
    }

    // Prevent deleting the last owner
    if (user.role === UserRole.OWNER) {
      const ownerCount = await db.user.count({
        where: {
          agencyId: session.user.agencyId,
          role: UserRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: { message: 'Cannot delete the last owner of the agency' } },
          { status: 400 }
        );
      }
    }

    // Delete user
    await db.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'USER',
        resourceId: userId,
        details: {
          deletedUser: {
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to delete user' 
        } 
      },
      { status: 500 }
    );
  }
}