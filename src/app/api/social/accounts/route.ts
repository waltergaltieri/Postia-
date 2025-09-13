import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, SocialPlatform } from '@/generated/prisma';
import { db } from '@/lib/db';
import { getClientSocialAccounts, storeSocialAccount, getOAuthUrl } from '@/lib/services/social-media';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: { message: 'Client ID is required' } },
        { status: 400 }
      );
    }

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Get social accounts for the client
    const accounts = await getClientSocialAccounts(clientId);

    // Remove sensitive data from response
    const sanitizedAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      accountId: account.accountId,
      accountName: account.accountName,
      isActive: account.isActive,
      expiresAt: account.expiresAt,
      metadata: {
        profilePicture: account.metadata.profilePicture,
        followerCount: account.metadata.followerCount,
        accountType: account.metadata.accountType,
      },
    }));

    return NextResponse.json({
      success: true,
      data: { accounts: sanitizedAccounts },
    });
  } catch (error) {
    console.error('Get social accounts error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch social accounts' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.CONNECT_SOCIAL_ACCOUNTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to connect social accounts' } },
        { status: 403 }
      );
    }

    const {
      clientId,
      platform,
      accountId,
      accountName,
      accessToken,
      refreshToken,
      expiresAt,
      metadata = {},
    } = await request.json();

    // Validate required fields
    if (!clientId || !platform || !accountId || !accountName || !accessToken) {
      return NextResponse.json(
        { error: { message: 'Client ID, platform, account ID, account name, and access token are required' } },
        { status: 400 }
      );
    }

    // Validate platform
    if (!Object.values(SocialPlatform).includes(platform)) {
      return NextResponse.json(
        { error: { message: 'Invalid social media platform' } },
        { status: 400 }
      );
    }

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Verify client exists and belongs to the same agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Store social account
    const account = await storeSocialAccount(clientId, platform, {
      accountId,
      accountName,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'CONNECT',
        resource: 'SOCIAL_ACCOUNT',
        resourceId: account.id,
        details: {
          clientId,
          platform,
          accountName,
          accountId,
        },
      },
    });

    // Remove sensitive data from response
    const sanitizedAccount = {
      id: account.id,
      platform: account.platform,
      accountId: account.accountId,
      accountName: account.accountName,
      isActive: account.isActive,
      expiresAt: account.expiresAt,
      metadata: {
        profilePicture: account.metadata.profilePicture,
        followerCount: account.metadata.followerCount,
        accountType: account.metadata.accountType,
      },
    };

    return NextResponse.json({
      success: true,
      data: { 
        account: sanitizedAccount,
        message: 'Social account connected successfully',
      },
    });
  } catch (error) {
    console.error('Connect social account error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to connect social account' 
        } 
      },
      { status: 500 }
    );
  }
}