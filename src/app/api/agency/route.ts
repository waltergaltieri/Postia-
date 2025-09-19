import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get agency information
    const agency = await db.agency.findUnique({
      where: { id: session.user.agencyId || '' },
      select: {
        id: true,
        name: true,
        tokenBalance: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            clients: true,
          },
        },
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: { message: 'Agency not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { agency },
    });
  } catch (error) {
    console.error('Get agency error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch agency information' 
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_AGENCY)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to update agency' } },
        { status: 403 }
      );
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'Agency name is required' } },
        { status: 400 }
      );
    }

    // Update agency
    const updatedAgency = await db.agency.update({
      where: { id: session.user.agencyId || '' },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        tokenBalance: true,
        createdAt: true,
      },
    });

    // TODO: Create audit log when AuditLog model is available
    // await db.auditLog.create({
    //   data: {
    //     agencyId: session.user.agencyId || '',
    //     userId: session.user.id,
    //     action: 'UPDATE',
    //     resource: 'AGENCY',
    //     resourceId: session.user.agencyId || '',
    //     details: {
    //       updatedFields: ['name'],
    //       newName: name.trim(),
    //     },
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: { agency: updatedAgency },
    });
  } catch (error) {
    console.error('Update agency error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to update agency' 
        } 
      },
      { status: 500 }
    );
  }
}