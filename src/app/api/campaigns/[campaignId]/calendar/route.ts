import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessClient } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { campaignId } = params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format
    const year = searchParams.get('year');

    // Verify campaign exists and user has access
    const campaign = await db.campaign.findFirst({
      where: {
        id: campaignId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
            assignedUsers: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: { message: 'Campaign not found' } },
        { status: 404 }
      );
    }

    // Check if user can access this campaign's client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      campaign.client.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this campaign' } },
        { status: 403 }
      );
    }

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (month) {
      // Get specific month
      const [yearStr, monthStr] = month.split('-');
      startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);
    } else if (year) {
      // Get specific year
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
    } else {
      // Default to campaign date range
      startDate = campaign.startDate;
      endDate = campaign.endDate;
    }

    // Get posts within the date range
    const posts = await db.post.findMany({
      where: {
        campaignId,
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        content: true,
        scheduledFor: true,
        status: true,
        platforms: true,
        imageUrl: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Group posts by date
    const postsByDate: Record<string, typeof posts> = {};
    
    posts.forEach(post => {
      const dateKey = post.scheduledFor.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = [];
      }
      postsByDate[dateKey].push(post);
    });

    // Generate calendar data
    const calendarData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayPosts = postsByDate[dateKey] || [];
      
      calendarData.push({
        date: dateKey,
        dayOfWeek: currentDate.getDay(),
        posts: dayPosts,
        postCount: dayPosts.length,
        statusCounts: {
          draft: dayPosts.filter(p => p.status === 'DRAFT').length,
          approved: dayPosts.filter(p => p.status === 'APPROVED').length,
          published: dayPosts.filter(p => p.status === 'PUBLISHED').length,
        },
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary statistics
    const totalPosts = posts.length;
    const statusCounts = {
      draft: posts.filter(p => p.status === 'DRAFT').length,
      approved: posts.filter(p => p.status === 'APPROVED').length,
      published: posts.filter(p => p.status === 'PUBLISHED').length,
    };

    const platformCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.platforms.forEach(platform => {
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          status: campaign.status,
          client: campaign.client,
        },
        calendar: calendarData,
        summary: {
          totalPosts,
          statusCounts,
          platformCounts,
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
        },
      },
    });
  } catch (error) {
    console.error('Get campaign calendar error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch campaign calendar' 
        } 
      },
      { status: 500 }
    );
  }
}