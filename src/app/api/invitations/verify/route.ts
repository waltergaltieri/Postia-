import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Invitation token is required' } },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await db.userInvitation.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        agency: {
          select: {
            name: true,
          },
        },
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired invitation' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          email: invitation.email,
          role: invitation.role,
          agency: invitation.agency,
          sender: invitation.sender,
          expiresAt: invitation.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to verify invitation' 
        } 
      },
      { status: 500 }
    );
  }
}