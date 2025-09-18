import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAgencyWithOwner } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: { message: 'Invalid JSON in request body' } },
        { status: 400 }
      );
    }

    const { agencyName, role } = body;

    // Enhanced validation
    if (!agencyName || typeof agencyName !== 'string' || agencyName.trim().length < 2) {
      return NextResponse.json(
        { error: { message: 'Agency name must be at least 2 characters long' } },
        { status: 400 }
      );
    }

    if (!role || !['OWNER', 'MANAGER', 'COLLABORATOR'].includes(role)) {
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    // Check if user already has complete registration
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      include: { agency: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    // Security check: Only allow registration completion for users who actually need it
    if (existingUser.agencyId && existingUser.role) {
      return NextResponse.json(
        { error: { message: 'User registration is already complete' } },
        { status: 400 }
      );
    }

    // Additional security: Verify this is a Google OAuth user
    if (!existingUser.emailVerified) {
      return NextResponse.json(
        { error: { message: 'Email verification required before completing registration' } },
        { status: 400 }
      );
    }

    // Create agency and update user
    const result = await db.$transaction(async (tx) => {
      // Create the agency
      const agency = await tx.agency.create({
        data: {
          name: agencyName,
          slug: agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          tokenBalance: 100, // Initial token balance
        },
      });

      // Update the user with agency and role
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          agencyId: agency.id,
          role: role,
        },
        include: {
          agency: true,
        },
      });

      return { user: updatedUser, agency };
    });

    return NextResponse.json({
      message: 'Registration completed successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        agencyId: result.user.agencyId,
        agency: result.user.agency,
      },
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}