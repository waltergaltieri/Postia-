import { db } from '@/lib/db';
import { SocialPlatform, PublicationStatus } from '@/generated/prisma';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
  metadata: {
    profilePicture?: string;
    followerCount?: number;
    accountType?: string;
    permissions?: string[];
  };
}

export interface PublishRequest {
  content: string;
  imageUrl?: string;
  scheduledFor?: Date;
  platforms: SocialPlatform[];
  clientId: string;
  campaignId?: string;
  postId?: string;
}

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  platformPostId?: string;
  error?: string;
  publishedAt?: Date;
  postUrl?: string;
}

export interface PlatformLimits {
  maxTextLength: number;
  maxHashtags: number;
  supportedImageFormats: string[];
  maxImageSize: number; // in MB
  supportsScheduling: boolean;
  supportsVideo: boolean;
}

/**
 * Platform-specific limits and capabilities
 */
export const PLATFORM_LIMITS: Record<SocialPlatform, PlatformLimits> = {
  [SocialPlatform.FACEBOOK]: {
    maxTextLength: 63206,
    maxHashtags: 30,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxImageSize: 10,
    supportsScheduling: true,
    supportsVideo: true,
  },
  [SocialPlatform.INSTAGRAM]: {
    maxTextLength: 2200,
    maxHashtags: 30,
    supportedImageFormats: ['jpg', 'jpeg', 'png'],
    maxImageSize: 8,
    supportsScheduling: true,
    supportsVideo: true,
  },
  [SocialPlatform.LINKEDIN]: {
    maxTextLength: 3000,
    maxHashtags: 3,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    maxImageSize: 5,
    supportsScheduling: true,
    supportsVideo: true,
  },
};

/**
 * Get social accounts for a client
 */
export async function getClientSocialAccounts(clientId: string): Promise<SocialAccount[]> {
  const accounts = await db.socialAccount.findMany({
    where: { 
      clientId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return accounts.map(account => ({
    id: account.id,
    platform: account.platform,
    accountId: account.accountId,
    accountName: account.accountName,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken || undefined,
    expiresAt: account.expiresAt || undefined,
    isActive: account.isActive,
    metadata: account.metadata as any,
  }));
}

/**
 * Store social account connection
 */
export async function storeSocialAccount(
  clientId: string,
  platform: SocialPlatform,
  accountData: {
    accountId: string;
    accountName: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: any;
  }
): Promise<SocialAccount> {
  // Deactivate existing accounts for the same platform
  await db.socialAccount.updateMany({
    where: {
      clientId,
      platform,
      accountId: accountData.accountId,
    },
    data: { isActive: false },
  });

  // Create new account record
  const account = await db.socialAccount.create({
    data: {
      clientId,
      platform,
      accountId: accountData.accountId,
      accountName: accountData.accountName,
      accessToken: accountData.accessToken,
      refreshToken: accountData.refreshToken,
      expiresAt: accountData.expiresAt,
      isActive: true,
      metadata: accountData.metadata || {},
    },
  });

  return {
    id: account.id,
    platform: account.platform,
    accountId: account.accountId,
    accountName: account.accountName,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken || undefined,
    expiresAt: account.expiresAt || undefined,
    isActive: account.isActive,
    metadata: account.metadata as any,
  };
}

/**
 * Refresh access token for a social account
 */
export async function refreshSocialAccountToken(accountId: string): Promise<SocialAccount | null> {
  const account = await db.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.refreshToken) {
    return null;
  }

  try {
    let newTokenData;

    switch (account.platform) {
      case SocialPlatform.FACEBOOK:
        newTokenData = await refreshFacebookToken(account.refreshToken);
        break;
      case SocialPlatform.INSTAGRAM:
        newTokenData = await refreshInstagramToken(account.refreshToken);
        break;
      case SocialPlatform.LINKEDIN:
        newTokenData = await refreshLinkedInToken(account.refreshToken);
        break;
      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }

    // Update account with new token data
    const updatedAccount = await db.socialAccount.update({
      where: { id: accountId },
      data: {
        accessToken: newTokenData.accessToken,
        refreshToken: newTokenData.refreshToken || account.refreshToken,
        expiresAt: newTokenData.expiresAt,
      },
    });

    return {
      id: updatedAccount.id,
      platform: updatedAccount.platform,
      accountId: updatedAccount.accountId,
      accountName: updatedAccount.accountName,
      accessToken: updatedAccount.accessToken,
      refreshToken: updatedAccount.refreshToken || undefined,
      expiresAt: updatedAccount.expiresAt || undefined,
      isActive: updatedAccount.isActive,
      metadata: updatedAccount.metadata as any,
    };
  } catch (error) {
    console.error(`Failed to refresh token for ${account.platform}:`, error);
    
    // Mark account as inactive if refresh fails
    await db.socialAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return null;
  }
}

/**
 * Validate content for platform-specific requirements
 */
export function validateContentForPlatform(
  content: string,
  platform: SocialPlatform,
  imageUrl?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const limits = PLATFORM_LIMITS[platform];

  // Check text length
  if (content.length > limits.maxTextLength) {
    errors.push(`Content exceeds maximum length of ${limits.maxTextLength} characters for ${platform}`);
  }

  // Check hashtag count
  const hashtags = content.match(/#\w+/g) || [];
  if (hashtags.length > limits.maxHashtags) {
    errors.push(`Too many hashtags (${hashtags.length}). Maximum allowed for ${platform}: ${limits.maxHashtags}`);
  }

  // Check image format if provided
  if (imageUrl) {
    const extension = imageUrl.split('.').pop()?.toLowerCase();
    if (extension && !limits.supportedImageFormats.includes(extension)) {
      errors.push(`Unsupported image format for ${platform}. Supported formats: ${limits.supportedImageFormats.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Publish content to multiple platforms
 */
export async function publishToSocialMedia(request: PublishRequest): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  // Get social accounts for the client
  const socialAccounts = await getClientSocialAccounts(request.clientId);

  for (const platform of request.platforms) {
    try {
      // Find account for this platform
      const account = socialAccounts.find(acc => acc.platform === platform && acc.isActive);
      
      if (!account) {
        results.push({
          platform,
          success: false,
          error: `No active ${platform} account found for this client`,
        });
        continue;
      }

      // Validate content for platform
      const validation = validateContentForPlatform(request.content, platform, request.imageUrl);
      if (!validation.isValid) {
        results.push({
          platform,
          success: false,
          error: `Content validation failed: ${validation.errors.join(', ')}`,
        });
        continue;
      }

      // Check if token needs refresh
      if (account.expiresAt && account.expiresAt < new Date()) {
        const refreshedAccount = await refreshSocialAccountToken(account.id);
        if (!refreshedAccount) {
          results.push({
            platform,
            success: false,
            error: `Failed to refresh access token for ${platform}`,
          });
          continue;
        }
        account.accessToken = refreshedAccount.accessToken;
      }

      // Publish to platform
      let publishResult;
      switch (platform) {
        case SocialPlatform.FACEBOOK:
          publishResult = await publishToFacebook(account, request);
          break;
        case SocialPlatform.INSTAGRAM:
          publishResult = await publishToInstagram(account, request);
          break;
        case SocialPlatform.LINKEDIN:
          publishResult = await publishToLinkedIn(account, request);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      results.push(publishResult);

      // Store publication record
      if (publishResult.success && request.postId) {
        await db.socialPublication.create({
          data: {
            postId: request.postId,
            platform,
            platformPostId: publishResult.platformPostId || '',
            status: PublicationStatus.PUBLISHED,
            publishedAt: publishResult.publishedAt || new Date(),
            postUrl: publishResult.postUrl,
            metadata: {
              accountId: account.accountId,
              accountName: account.accountName,
            },
          },
        });
      }

    } catch (error) {
      console.error(`Failed to publish to ${platform}:`, error);
      results.push({
        platform,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  return results;
}

/**
 * Disconnect social account
 */
export async function disconnectSocialAccount(accountId: string): Promise<void> {
  await db.socialAccount.update({
    where: { id: accountId },
    data: { isActive: false },
  });
}

/**
 * Get platform-specific OAuth URL
 */
export function getOAuthUrl(platform: SocialPlatform, clientId: string, redirectUri: string): string {
  const baseUrls = {
    [SocialPlatform.FACEBOOK]: 'https://www.facebook.com/v18.0/dialog/oauth',
    [SocialPlatform.INSTAGRAM]: 'https://api.instagram.com/oauth/authorize',
    [SocialPlatform.LINKEDIN]: 'https://www.linkedin.com/oauth/v2/authorization',
  };

  const scopes = {
    [SocialPlatform.FACEBOOK]: 'pages_manage_posts,pages_read_engagement,pages_show_list',
    [SocialPlatform.INSTAGRAM]: 'instagram_basic,instagram_content_publish',
    [SocialPlatform.LINKEDIN]: 'w_member_social,r_liteprofile',
  };

  const params = new URLSearchParams({
    client_id: getClientIdForPlatform(platform),
    redirect_uri: redirectUri,
    scope: scopes[platform],
    response_type: 'code',
    state: `${platform}-${clientId}`,
  });

  return `${baseUrls[platform]}?${params.toString()}`;
}

// Platform-specific implementation functions (these would be implemented based on actual API docs)

async function refreshFacebookToken(refreshToken: string) {
  // Implementation for Facebook token refresh
  // This is a placeholder - implement according to Facebook Graph API docs
  throw new Error('Facebook token refresh not implemented');
}

async function refreshInstagramToken(refreshToken: string) {
  // Implementation for Instagram token refresh
  // This is a placeholder - implement according to Instagram Basic Display API docs
  throw new Error('Instagram token refresh not implemented');
}

async function refreshLinkedInToken(refreshToken: string) {
  // Implementation for LinkedIn token refresh
  // This is a placeholder - implement according to LinkedIn API docs
  throw new Error('LinkedIn token refresh not implemented');
}

async function publishToFacebook(account: SocialAccount, request: PublishRequest): Promise<PublishResult> {
  // Implementation for Facebook publishing
  // This is a placeholder - implement according to Facebook Graph API docs
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    platform: SocialPlatform.FACEBOOK,
    success: true,
    platformPostId: `fb_${Date.now()}`,
    publishedAt: new Date(),
    postUrl: `https://facebook.com/posts/${Date.now()}`,
  };
}

async function publishToInstagram(account: SocialAccount, request: PublishRequest): Promise<PublishResult> {
  // Implementation for Instagram publishing
  // This is a placeholder - implement according to Instagram Graph API docs
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    platform: SocialPlatform.INSTAGRAM,
    success: true,
    platformPostId: `ig_${Date.now()}`,
    publishedAt: new Date(),
    postUrl: `https://instagram.com/p/${Date.now()}`,
  };
}

async function publishToLinkedIn(account: SocialAccount, request: PublishRequest): Promise<PublishResult> {
  // Implementation for LinkedIn publishing
  // This is a placeholder - implement according to LinkedIn API docs
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    platform: SocialPlatform.LINKEDIN,
    success: true,
    platformPostId: `li_${Date.now()}`,
    publishedAt: new Date(),
    postUrl: `https://linkedin.com/posts/${Date.now()}`,
  };
}

function getClientIdForPlatform(platform: SocialPlatform): string {
  const clientIds = {
    [SocialPlatform.FACEBOOK]: process.env.FACEBOOK_CLIENT_ID || '',
    [SocialPlatform.INSTAGRAM]: process.env.INSTAGRAM_CLIENT_ID || '',
    [SocialPlatform.LINKEDIN]: process.env.LINKEDIN_CLIENT_ID || '',
  };

  return clientIds[platform];
}

/**
 * Get publication status for a post
 */
export async function getPublicationStatus(postId: string): Promise<Array<{
  platform: SocialPlatform;
  status: PublicationStatus;
  publishedAt?: Date;
  error?: string;
  postUrl?: string;
}>> {
  const publications = await db.socialPublication.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
  });

  return publications.map(pub => ({
    platform: pub.platform,
    status: pub.status,
    publishedAt: pub.publishedAt || undefined,
    error: pub.error || undefined,
    postUrl: pub.postUrl || undefined,
  }));
}

/**
 * Update publication status
 */
export async function updatePublicationStatus(
  postId: string,
  platform: SocialPlatform,
  status: PublicationStatus,
  error?: string
): Promise<void> {
  await db.socialPublication.updateMany({
    where: {
      postId,
      platform,
    },
    data: {
      status,
      error,
      updatedAt: new Date(),
    },
  });
}