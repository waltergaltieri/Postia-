import { NextRequest, NextResponse } from 'next/server';
import { createAgencyWithOwner, validatePassword, isEmailInUse, sendVerificationEmail } from '@/lib/auth-utils';
import { createAuditLog } from '@/lib/database-utils';
import type { CreateAgencyRequest } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgencyRequest = await request.json();
    const { name, ownerName, ownerEmail, ownerPassword } = body;

    // Validate required fields
    if (!name || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { error: { message: 'All fields are required' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return NextResponse.json(
        { error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Check if email is already in use
    if (await isEmailInUse(ownerEmail)) {
      return NextResponse.json(
        { error: { message: 'Email is already registered' } },
        { status: 409 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(ownerPassword);
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

    // Create agency and owner
    const { agency, owner, emailVerificationToken } = await createAgencyWithOwner({
      name,
      ownerName,
      ownerEmail,
      ownerPassword,
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: owner.email,
        name: owner.name,
        token: emailVerificationToken,
        agencyName: agency.name,
        isInvitation: false,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        agency: {
          id: agency.id,
          name: agency.name,
        },
        owner: {
          id: owner.id,
          email: owner.email,
          name: owner.name,
        },
        message: 'Agency created successfully. Please check your email to verify your account.',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Internal server error' 
        } 
      },
      { status: 500 }
    );
  }
}