import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessClient } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { getPublicationStatus } from '@/lib/services/social-media';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { postId } = params;

    // Verify post exists and user has access
    const post = await db.post.findFirst({
      where: {
        id: postId,
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
        campaign: {
          select: {
            id: true,
            name: true,
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

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      post.clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Get publication status
    const publicationStatus = await getPublicationStatus(postId);

    // Get detailed publication records
    const publications = await db.socialPublication.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        platformPostId: true,
        status: true,
        publishedAt: true,
        error: true,
        postUrl: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post.id,
          content: post.content,
          status: post.status,
          scheduledFor: post.scheduledFor,
          publishedAt: post.publishedAt,
          platforms: post.platforms,
          client: post.client,
          campaign: post.campaign,
        },
        publicationStatus,
        publications,
        summary: {
          totalPlatforms: post.platforms.length,
          publishedPlatforms: publicationStatus.filter(p => p.status === 'PUBLISHED').length,
          failedPlatforms: publicationStatus.filter(p => p.status === 'FAILED').length,
          pendingPlatforms: publicationStatus.filter(p => p.status === 'PENDING').length,
        },
      },
    });
  } catch (error) {
    console.error('Get publication status error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch publication status' 
        } 
      },
      { status: 500 }
    );
  }
}