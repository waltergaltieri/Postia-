import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { createUserInvitation, sendVerificationEmail } from '@/lib/auth-utils';
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.INVITE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to view invitations' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'pending', 'used', 'expired'

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      agencyId: session.user.agencyId,
    };

    if (status === 'pending') {
      where.usedAt = null;
      where.expiresAt = { gt: new Date() };
    } else if (status === 'used') {
      where.usedAt = { not: null };
    } else if (status === 'expired') {
      where.usedAt = null;
      where.expiresAt = { lte: new Date() };
    }

    // Get invitations with pagination
    const [invitations, total] = await Promise.all([
      db.userInvitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          expiresAt: true,
          usedAt: true,
          clientIds: true,
          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      db.userInvitation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        invitations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch invitations' 
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.INVITE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to send invitations' } },
        { status: 403 }
      );
    }

    const { email, role, clientIds = [] } = await request.json();

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: { message: 'Email and role are required' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: { message: 'Invalid role' } },
        { status: 400 }
      );
    }

    // Validate client IDs if provided
    if (clientIds.length > 0) {
      const validClients = await db.client.findMany({
        where: {
          id: { in: clientIds },
          agencyId: session.user.agencyId,
        },
      });

      if (validClients.length !== clientIds.length) {
        return NextResponse.json(
          { error: { message: 'Some client IDs are invalid' } },
          { status: 400 }
        );
      }
    }

    try {
      // Create invitation
      const invitation = await createUserInvitation(
        session.user.id,
        session.user.agencyId,
        email.toLowerCase(),
        role,
        clientIds
      );

      // Get agency info for email
      const agency = await db.agency.findUnique({
        where: { id: session.user.agencyId },
        select: { name: true },
      });

      // Send invitation email
      try {
        await sendVerificationEmail({
          email: invitation.email,
          name: invitation.email.split('@')[0], // Use email prefix as name since we don't have it yet
          token: invitation.token,
          agencyName: agency?.name || 'Postia Agency',
          isInvitation: true,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            clientIds: invitation.clientIds,
          },
          message: 'Invitation sent successfully',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Create invitation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to create invitation' 
        } 
      },
      { status: 500 }
    );
  }
}