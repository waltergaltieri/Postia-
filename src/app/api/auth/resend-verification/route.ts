import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/auth-utils';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required' } },
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

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        agency: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        data: {
          message: 'If an account with this email exists, a verification email has been sent.',
        },
      });
    }

    // If already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: { message: 'Email is already verified' } },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Update user with new token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken,
        agencyName: user.agency.name,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      
      return NextResponse.json(
        { error: { message: 'Failed to send verification email' } },
        { status: 500 }
      );
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: user.agencyId,
        userId: user.id,
        action: 'RESEND_VERIFICATION',
        resource: 'USER',
        resourceId: user.id,
        details: {
          email: user.email,
          resentAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Verification email sent successfully',
      },
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to resend verification email' 
        } 
      },
      { status: 500 }
    );
  }
}