import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken, validatePassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: { message: 'Token and password are required' } },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: { 
            message: 'Password does not meet requirements',
            details: passwordValidation.errors
          } 
        },
        { status: 400 }
      );
    }

    const user = await resetPasswordWithToken(token, password);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Password reset successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error('Password reset error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Password reset failed' 
        } 
      },
      { status: 400 }
    );
  }
}