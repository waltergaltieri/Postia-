import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Verification token is required' } },
        { status: 400 }
      );
    }

    // Find user with the verification token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
      include: {
        agency: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired verification token' } },
        { status: 400 }
      );
    }

    // If user already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: { message: 'Email already verified' } },
        { status: 400 }
      );
    }

    // Update user data
    const updateData: any = {
      emailVerified: new Date(),
      emailVerificationToken: null,
    };

    // If password is provided (for new registrations), hash and save it
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: { message: 'Password must be at least 8 characters long' } },
          { status: 400 }
        );
      }
      updateData.password = await hash(password, 12);
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: user.agencyId,
        userId: user.id,
        action: 'VERIFY_EMAIL',
        resource: 'USER',
        resourceId: user.id,
        details: {
          email: user.email,
          verifiedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to verify email' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Verification token is required' } },
        { status: 400 }
      );
    }

    // Find user with the verification token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired verification token' } },
        { status: 400 }
      );
    }

    // If user already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: { message: 'Email already verified' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
        needsPassword: !user.password, // True if user was invited and needs to set password
      },
    });
  } catch (error) {
    console.error('Get verification token error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to validate verification token' 
        } 
      },
      { status: 500 }
    );
  }
}