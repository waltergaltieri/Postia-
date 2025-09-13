import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SocialPlatform } from '@/generated/prisma';
import { db } from '@/lib/db';
import { storeSocialAccount } from '@/lib/services/social-media';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/clients?error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/clients?error=Invalid OAuth callback parameters`
      );
    }

    // Parse state to get platform and client ID
    const [platform, clientId] = state.split('-');
    
    if (!platform || !clientId || !Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/clients?error=Invalid OAuth state parameter`
      );
    }

    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/signin?callbackUrl=${encodeURIComponent(request.url)}`
      );
    }

    // Verify client belongs to user's agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!client) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/clients?error=Client not found or access denied`
      );
    }

    try {
      // Exchange code for access token
      const tokenData = await exchangeCodeForToken(platform as SocialPlatform, code);
      
      // Get account information
      const accountInfo = await getAccountInfo(platform as SocialPlatform, tokenData.accessToken);

      // Store social account
      await storeSocialAccount(clientId, platform as SocialPlatform, {
        accountId: accountInfo.id,
        accountName: accountInfo.name,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        metadata: {
          profilePicture: accountInfo.profilePicture,
          followerCount: accountInfo.followerCount,
          accountType: accountInfo.accountType,
          permissions: tokenData.permissions,
        },
      });

      // Create audit log
      await db.auditLog.create({
        data: {
          agencyId: session.user.agencyId,
          userId: session.user.id,
          action: 'OAUTH_CONNECT',
          resource: 'SOCIAL_ACCOUNT',
          resourceId: `${platform}-${accountInfo.id}`,
          details: {
            platform,
            clientId,
            accountName: accountInfo.name,
            accountId: accountInfo.id,
          },
        },
      });

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/clients/${clientId}?tab=social&success=Account connected successfully`
      );

    } catch (error) {
      console.error('OAuth token exchange error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/clients/${clientId}?tab=social&error=${encodeURIComponent('Failed to connect social account')}`
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/clients?error=OAuth callback failed`
    );
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(platform: SocialPlatform, code: string) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/oauth/callback`;

  switch (platform) {
    case SocialPlatform.FACEBOOK:
      return await exchangeFacebookCode(code, redirectUri);
    case SocialPlatform.INSTAGRAM:
      return await exchangeInstagramCode(code, redirectUri);
    case SocialPlatform.LINKEDIN:
      return await exchangeLinkedInCode(code, redirectUri);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get account information using access token
 */
async function getAccountInfo(platform: SocialPlatform, accessToken: string) {
  switch (platform) {
    case SocialPlatform.FACEBOOK:
      return await getFacebookAccountInfo(accessToken);
    case SocialPlatform.INSTAGRAM:
      return await getInstagramAccountInfo(accessToken);
    case SocialPlatform.LINKEDIN:
      return await getLinkedInAccountInfo(accessToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Platform-specific implementation functions

async function exchangeFacebookCode(code: string, redirectUri: string) {
  // Implementation for Facebook token exchange
  // This is a placeholder - implement according to Facebook Graph API docs
  
  const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID || '',
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Facebook code for token');
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    permissions: data.scope?.split(',') || [],
  };
}

async function exchangeInstagramCode(code: string, redirectUri: string) {
  // Implementation for Instagram token exchange
  // This is a placeholder - implement according to Instagram Basic Display API docs
  
  const response = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID || '',
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Instagram code for token');
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    permissions: data.scope?.split(',') || [],
  };
}

async function exchangeLinkedInCode(code: string, redirectUri: string) {
  // Implementation for LinkedIn token exchange
  // This is a placeholder - implement according to LinkedIn API docs
  
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange LinkedIn code for token');
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    permissions: data.scope?.split(' ') || [],
  };
}

async function getFacebookAccountInfo(accessToken: string) {
  // Implementation for Facebook account info
  // This is a placeholder - implement according to Facebook Graph API docs
  
  const response = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`);
  
  if (!response.ok) {
    throw new Error('Failed to get Facebook account info');
  }

  const data = await response.json();
  
  return {
    id: data.id,
    name: data.name,
    profilePicture: data.picture?.data?.url,
    followerCount: 0, // Would need additional API call
    accountType: 'personal',
  };
}

async function getInstagramAccountInfo(accessToken: string) {
  // Implementation for Instagram account info
  // This is a placeholder - implement according to Instagram Basic Display API docs
  
  const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
  
  if (!response.ok) {
    throw new Error('Failed to get Instagram account info');
  }

  const data = await response.json();
  
  return {
    id: data.id,
    name: data.username,
    profilePicture: undefined,
    followerCount: 0, // Would need additional API call
    accountType: 'personal',
  };
}

async function getLinkedInAccountInfo(accessToken: string) {
  // Implementation for LinkedIn account info
  // This is a placeholder - implement according to LinkedIn API docs
  
  const response = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get LinkedIn account info');
  }

  const data = await response.json();
  
  return {
    id: data.id,
    name: `${data.firstName?.localized?.en_US || ''} ${data.lastName?.localized?.en_US || ''}`.trim(),
    profilePicture: data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
    followerCount: 0, // Would need additional API call
    accountType: 'professional',
  };
}