import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { UserRole } from '@/generated/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, agencyId: true }
    })

    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.MANAGER)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const agencyId = user.agencyId
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'No agency associated with user' },
        { status: 400 }
      )
    }

    // Get recent activity from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch recent clients
    const recentClients = await db.client.findMany({
      where: {
        agencyId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        id: true,
        name: true,
        brandName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Fetch recent campaigns
    const recentCampaigns = await db.campaign.findMany({
      where: {
        client: { agencyId },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            name: true,
            brandName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Fetch recent content
    const recentContent = await db.content.findMany({
      where: {
        campaign: {
          client: { agencyId }
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        campaign: {
          select: {
            name: true,
            client: {
              select: {
                name: true,
                brandName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Combine and format activity
    const activity = []

    // Add client activities
    recentClients.forEach(client => {
      activity.push({
        id: `client-${client.id}`,
        type: 'client_created' as const,
        description: `New client "${client.brandName || client.name}" was added`,
        timestamp: client.createdAt,
        clientName: client.brandName || client.name
      })
    })

    // Add campaign activities
    recentCampaigns.forEach(campaign => {
      activity.push({
        id: `campaign-${campaign.id}`,
        type: 'campaign_launched' as const,
        description: `Campaign "${campaign.name}" was ${campaign.status === 'ACTIVE' ? 'launched' : 'created'}`,
        timestamp: campaign.createdAt,
        clientName: campaign.client.brandName || campaign.client.name
      })
    })

    // Add content activities
    recentContent.forEach(content => {
      activity.push({
        id: `content-${content.id}`,
        type: 'content_generated' as const,
        description: `${content.type} content was generated for "${content.campaign.name}"`,
        timestamp: content.createdAt,
        clientName: content.campaign.client.brandName || content.campaign.client.name
      })
    })

    // Sort by timestamp and limit to 10 most recent
    const sortedActivity = activity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: sortedActivity
    })

  } catch (error) {
    console.error('Error fetching admin dashboard activity:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}