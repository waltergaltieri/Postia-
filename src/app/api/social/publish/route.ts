import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, SocialPlatform, PostStatus } from '@/generated/prisma';
import { db } from '@/lib/db';
import { publishToSocialMedia, validateContentForPlatform } from '@/lib/services/social-media';

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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.PUBLISH_CONTENT)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to publish content' } },
        { status: 403 }
      );
    }

    const {
      postId,
      clientId,
      campaignId,
      content,
      imageUrl,
      platforms,
      scheduledFor,
    } = await request.json();

    // Validate required fields
    if (!postId || !clientId || !content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: { message: 'Post ID, client ID, content, and at least one platform are required' } },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms = platforms.filter((platform: string) => 
      Object.values(SocialPlatform).includes(platform as SocialPlatform)
    );

    if (validPlatforms.length !== platforms.length) {
      return NextResponse.json(
        { error: { message: 'Invalid social media platforms specified' } },
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

    // Verify post exists and belongs to the client
    const post = await db.post.findFirst({
      where: {
        id: postId,
        clientId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: { message: 'Post not found or access denied' } },
        { status: 404 }
      );
    }

    // Check if post is approved for publishing
    if (post.status !== PostStatus.APPROVED) {
      return NextResponse.json(
        { error: { message: 'Post must be approved before publishing' } },
        { status: 400 }
      );
    }

    // Validate content for each platform
    const validationErrors: string[] = [];
    for (const platform of validPlatforms) {
      const validation = validateContentForPlatform(content, platform, imageUrl);
      if (!validation.isValid) {
        validationErrors.push(`${platform}: ${validation.errors.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: { 
            message: 'Content validation failed',
            details: validationErrors,
          } 
        },
        { status: 400 }
      );
    }

    // Publish to social media platforms
    const publishResults = await publishToSocialMedia({
      content,
      imageUrl,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      platforms: validPlatforms,
      clientId,
      campaignId,
      postId,
    });

    // Update post status based on results
    const successfulPublications = publishResults.filter(result => result.success);
    const failedPublications = publishResults.filter(result => !result.success);

    let newPostStatus = PostStatus.PUBLISHED;
    if (successfulPublications.length === 0) {
      newPostStatus = PostStatus.DRAFT; // All failed, revert to draft
    } else if (failedPublications.length > 0) {
      // Partial success - keep as published but note failures
      newPostStatus = PostStatus.PUBLISHED;
    }

    // Update post status
    await db.post.update({
      where: { id: postId },
      data: {
        status: newPostStatus,
        publishedAt: successfulPublications.length > 0 ? new Date() : null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'PUBLISH',
        resource: 'POST',
        resourceId: postId,
        details: {
          clientId,
          campaignId,
          platforms: validPlatforms,
          successfulPlatforms: successfulPublications.map(r => r.platform),
          failedPlatforms: failedPublications.map(r => r.platform),
          publishResults,
        },
      },
    });

    // Prepare response
    const response = {
      success: successfulPublications.length > 0,
      data: {
        postId,
        publishResults,
        summary: {
          total: publishResults.length,
          successful: successfulPublications.length,
          failed: failedPublications.length,
        },
        message: successfulPublications.length === publishResults.length
          ? 'Content published successfully to all platforms'
          : failedPublications.length === publishResults.length
          ? 'Failed to publish to any platform'
          : 'Content published with some failures',
      },
    };

    // Return appropriate status code
    const statusCode = successfulPublications.length > 0 ? 200 : 400;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Publish content error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to publish content' 
        } 
      },
      { status: 500 }
    );
  }
}