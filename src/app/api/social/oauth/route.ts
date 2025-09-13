import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, SocialPlatform } from '@/generated/prisma';
import { db } from '@/lib/db';
import { getOAuthUrl } from '@/lib/services/social-media';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as SocialPlatform;
    const clientId = searchParams.get('clientId');

    // Validate required parameters
    if (!platform || !clientId) {
      return NextResponse.json(
        { error: { message: 'Platform and client ID are required' } },
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

    // Verify client exists
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

    // Generate OAuth URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/oauth/callback`;
    const oauthUrl = getOAuthUrl(platform, clientId, redirectUri);

    return NextResponse.json({
      success: true,
      data: {
        oauthUrl,
        platform,
        clientId,
        redirectUri,
      },
    });
  } catch (error) {
    console.error('Get OAuth URL error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to generate OAuth URL' 
        } 
      },
      { status: 500 }
    );
  }
}