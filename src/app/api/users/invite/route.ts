import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUserInvitation } from '@/lib/auth-utils';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';

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
        { error: { message: 'Insufficient permissions to invite users' } },
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
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    // Only owners can invite other owners
    if (role === UserRole.OWNER && session.user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: { message: 'Only owners can invite other owners' } },
        { status: 403 }
      );
    }

    // Create invitation
    const invitation = await createUserInvitation(
      session.user.id,
      session.user.agencyId,
      email,
      role,
      clientIds
    );

    // TODO: Send invitation email
    // await sendInvitationEmail(invitation);

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
    console.error('User invitation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to send invitation' 
        } 
      },
      { status: 500 }
    );
  }
}