import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.INVITE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to cancel invitations' } },
        { status: 403 }
      );
    }

    const { invitationId } = params;

    // Get invitation to verify it belongs to the same agency
    const invitation = await db.userInvitation.findFirst({
      where: {
        id: invitationId,
        agencyId: session.user.agencyId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: { message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    // Check if invitation is already used
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: { message: 'Cannot cancel an invitation that has already been used' } },
        { status: 400 }
      );
    }

    // Delete invitation
    await db.userInvitation.delete({
      where: { id: invitationId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'INVITATION',
        resourceId: invitationId,
        details: {
          cancelledInvitation: {
            email: invitation.email,
            role: invitation.role,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Invitation cancelled successfully' },
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to cancel invitation' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.INVITE_USERS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to resend invitations' } },
        { status: 403 }
      );
    }

    const { invitationId } = params;

    // Get invitation to verify it belongs to the same agency
    const invitation = await db.userInvitation.findFirst({
      where: {
        id: invitationId,
        agencyId: session.user.agencyId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: { message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    // Check if invitation is already used
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: { message: 'Cannot resend an invitation that has already been used' } },
        { status: 400 }
      );
    }

    // Update expiration date
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await db.userInvitation.update({
      where: { id: invitationId },
      data: { expiresAt: newExpiresAt },
    });

    // TODO: Resend invitation email
    // await sendInvitationEmail(invitation);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'INVITATION',
        resourceId: invitationId,
        details: {
          action: 'resend',
          email: invitation.email,
          newExpiresAt,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Invitation resent successfully',
        expiresAt: newExpiresAt,
      },
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to resend invitation' 
        } 
      },
      { status: 500 }
    );
  }
}