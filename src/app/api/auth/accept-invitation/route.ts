import { NextRequest, NextResponse } from 'next/server';
import { acceptUserInvitation, validatePassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json();

    // Validate required fields
    if (!token || !name || !password) {
      return NextResponse.json(
        { error: { message: 'Token, name, and password are required' } },
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

    // Accept invitation
    const { user, invitation } = await acceptUserInvitation(token, {
      name: name.trim(),
      password,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        agency: {
          name: invitation.agency.name,
        },
        message: 'Invitation accepted successfully. You can now sign in.',
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to accept invitation' 
        } 
      },
      { status: 400 }
    );
  }
}