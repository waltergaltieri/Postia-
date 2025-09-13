import bcrypt from 'bcryptjs';
// import { randomBytes } from 'crypto'; // Unused for now
import { db } from './db';
import { generateSecureToken } from './database-utils';
import { UserRole, SubscriptionPlan } from '../generated/prisma';
import type { CreateAgencyRequest } from '../types/database';

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): string {
  return generateSecureToken(32);
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  return generateSecureToken(32);
}

/**
 * Create new agency with owner user
 */
export async function createAgencyWithOwner(data: CreateAgencyRequest) {
  const hashedPassword = await hashPassword(data.ownerPassword);
  const emailVerificationToken = generateEmailVerificationToken();

  return db.$transaction(async (tx) => {
    // Create agency
    const agency = await tx.agency.create({
      data: {
        name: data.name,
        subscriptionPlan: SubscriptionPlan.BASIC,
        tokenBalance: 100, // Initial free tokens
      },
    });

    // Create owner user
    const owner = await tx.user.create({
      data: {
        email: data.ownerEmail,
        name: data.ownerName,
        password: hashedPassword,
        role: UserRole.OWNER,
        agencyId: agency.id,
        emailVerificationToken,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        agencyId: agency.id,
        userId: owner.id,
        action: 'CREATE',
        resource: 'AGENCY',
        resourceId: agency.id,
        details: {
          agencyName: agency.name,
          ownerEmail: owner.email,
        },
      },
    });

    return { agency, owner, emailVerificationToken };
  });
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(token: string) {
  const user = await db.user.findFirst({
    where: {
      emailVerificationToken: token,
    },
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null,
    },
  });

  return user;
}

/**
 * Send password reset token
 */
export async function createPasswordResetToken(email: string) {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const resetToken = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: expiresAt,
    },
  });

  return { resetToken, user };
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const user = await db.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await hashPassword(newPassword);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return user;
}

/**
 * Create user invitation
 */
export async function createUserInvitation(
  senderId: string,
  agencyId: string,
  email: string,
  role: UserRole,
  clientIds: string[] = []
) {
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check if invitation already exists
  const existingInvitation = await db.userInvitation.findFirst({
    where: {
      email,
      agencyId,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw new Error('Invitation already sent to this email');
  }

  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await db.userInvitation.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      senderId,
      agencyId,
      clientIds,
    },
    include: {
      sender: true,
      agency: true,
    },
  });

  return invitation;
}

/**
 * Accept user invitation
 */
export async function acceptUserInvitation(
  token: string,
  userData: {
    name: string;
    password: string;
  }
) {
  const invitation = await db.userInvitation.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      agency: true,
    },
  });

  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  const hashedPassword = await hashPassword(userData.password);

  return db.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: invitation.email,
        name: userData.name,
        password: hashedPassword,
        role: invitation.role,
        agencyId: invitation.agencyId,
        emailVerified: new Date(), // Auto-verify invited users
      },
    });

    // Assign to clients if specified
    if (invitation.clientIds.length > 0) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          assignedClients: {
            connect: invitation.clientIds.map(id => ({ id })),
          },
        },
      });
    }

    // Mark invitation as used
    await tx.userInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        agencyId: invitation.agencyId,
        userId: user.id,
        action: 'ACCEPT_INVITATION',
        resource: 'USER',
        resourceId: user.id,
        details: {
          invitationId: invitation.id,
          role: invitation.role,
          assignedClients: invitation.clientIds,
        },
      },
    });

    return { user, invitation };
  });
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if email is already in use
 */
export async function isEmailInUse(email: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { email },
  });
  return !!user;
}

/**
 * Get user with permissions
 */
export async function getUserWithPermissions(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      agency: true,
      assignedClients: {
        select: {
          id: true,
          brandName: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
  agencyName,
  isInvitation = false,
}: {
  email: string;
  name: string;
  token: string;
  agencyName: string;
  isInvitation?: boolean;
}) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  
  // TODO: Implement actual email sending logic
  // For now, just log the verification link
  console.log(`
    ${isInvitation ? 'Invitation' : 'Verification'} email for ${name} (${email}):
    Agency: ${agencyName}
    Verification URL: ${verificationUrl}
    
    Email Template:
    Subject: ${isInvitation ? `Welcome to ${agencyName} - Complete Your Account Setup` : `Verify Your Email - ${agencyName}`}
    
    Hi ${name},
    
    ${isInvitation 
      ? `You've been invited to join ${agencyName} on Postia. Click the link below to complete your account setup:`
      : `Please verify your email address by clicking the link below:`
    }
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't ${isInvitation ? 'expect this invitation' : 'create an account'}, you can safely ignore this email.
    
    Best regards,
    The Postia Team
  `);
  
  // In production, you would use a service like:
  // - SendGrid
  // - AWS SES  
  // - Resend
  // - Nodemailer with SMTP
  
  // Example with Resend (uncomment when ready):
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'noreply@postia.com',
    to: email,
    subject: isInvitation ? `Welcome to ${agencyName} - Complete Your Account Setup` : `Verify Your Email - ${agencyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>${isInvitation 
          ? `You've been invited to join <strong>${agencyName}</strong> on Postia. Click the button below to complete your account setup:`
          : `Please verify your email address by clicking the button below:`
        }</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${isInvitation ? 'Complete Setup' : 'Verify Email'}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #666; font-size: 14px;">
          If you didn't ${isInvitation ? 'expect this invitation' : 'create an account'}, you can safely ignore this email.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">Best regards,<br>The Postia Team</p>
      </div>
    `,
  });
  */
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  // TODO: Implement actual email sending logic
  // For now, just log the reset link
  console.log(`
    Password reset email for ${name} (${email}):
    Reset URL: ${resetUrl}
    
    Email Template:
    Subject: Reset Your Password - Postia
    
    Hi ${name},
    
    You requested to reset your password. Click the link below to set a new password:
    
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, you can safely ignore this email.
    
    Best regards,
    The Postia Team
  `);
}