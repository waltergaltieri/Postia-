import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { disconnectSocialAccount, refreshSocialAccountToken } from '@/lib/services/social-media';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { accountId } = params;
    const { action } = await request.json();

    // Get social account
    const account = await db.socialAccount.findFirst({
      where: {
        id: accountId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: { message: 'Social account not found or access denied' } },
        { status: 404 }
      );
    }

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      account.clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    switch (action) {
      case 'refresh':
        // Check permissions for managing social accounts
        if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_SOCIAL_ACCOUNTS)) {
          return NextResponse.json(
            { error: { message: 'Insufficient permissions to refresh social accounts' } },
            { status: 403 }
          );
        }

        const refreshedAccount = await refreshSocialAccountToken(accountId);
        
        if (!refreshedAccount) {
          return NextResponse.json(
            { error: { message: 'Failed to refresh access token' } },
            { status: 400 }
          );
        }

        // Create audit log
        await db.auditLog.create({
          data: {
            agencyId: session.user.agencyId,
            userId: session.user.id,
            action: 'REFRESH',
            resource: 'SOCIAL_ACCOUNT',
            resourceId: accountId,
            details: {
              platform: account.platform,
              accountName: account.accountName,
            },
          },
        });

        // Remove sensitive data from response
        const sanitizedAccount = {
          id: refreshedAccount.id,
          platform: refreshedAccount.platform,
          accountId: refreshedAccount.accountId,
          accountName: refreshedAccount.accountName,
          isActive: refreshedAccount.isActive,
          expiresAt: refreshedAccount.expiresAt,
          metadata: {
            profilePicture: refreshedAccount.metadata.profilePicture,
            followerCount: refreshedAccount.metadata.followerCount,
            accountType: refreshedAccount.metadata.accountType,
          },
        };

        return NextResponse.json({
          success: true,
          data: {
            account: sanitizedAccount,
            message: 'Access token refreshed successfully',
          },
        });

      default:
        return NextResponse.json(
          { error: { message: 'Invalid action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Social account action error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to perform account action' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_SOCIAL_ACCOUNTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to disconnect social accounts' } },
        { status: 403 }
      );
    }

    const { accountId } = params;

    // Get social account
    const account = await db.socialAccount.findFirst({
      where: {
        id: accountId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: { message: 'Social account not found or access denied' } },
        { status: 404 }
      );
    }

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      account.clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Disconnect social account
    await disconnectSocialAccount(accountId);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DISCONNECT',
        resource: 'SOCIAL_ACCOUNT',
        resourceId: accountId,
        details: {
          platform: account.platform,
          accountName: account.accountName,
          clientId: account.clientId,
          clientName: account.client.brandName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Social account disconnected successfully' },
    });
  } catch (error) {
    console.error('Disconnect social account error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to disconnect social account' 
        } 
      },
      { status: 500 }
    );
  }
}