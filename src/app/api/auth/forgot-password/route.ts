import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken, sendPasswordResetEmail } from '@/lib/auth-utils';

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

    try {
      const { resetToken, user } = await createPasswordResetToken(email);

      // Send password reset email
      try {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          token: resetToken,
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't reveal if email sending failed for security
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Password reset link sent to your email',
        },
      });
    } catch (error) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent',
        },
      });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Internal server error' 
        } 
      },
      { status: 500 }
    );
  }
}