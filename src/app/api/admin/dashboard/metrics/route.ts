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

    // Get agency metrics
    const agencyId = user.agencyId
    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'No agency associated with user' },
        { status: 400 }
      )
    }

    // Get current date for monthly calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch metrics in parallel
    const [
      totalClients,
      activeClients,
      totalCampaigns,
      activeCampaigns,
      monthlyContent,
      lastMonthContent
    ] = await Promise.all([
      // Total clients
      db.client.count({
        where: { agencyId }
      }),
      
      // Active clients (clients with campaigns in the last 30 days)
      db.client.count({
        where: {
          agencyId,
          isActive: true
        }
      }),
      
      // Total campaigns
      db.campaign.count({
        where: {
          client: { agencyId }
        }
      }),
      
      // Active campaigns
      db.campaign.count({
        where: {
          client: { agencyId },
          status: 'ACTIVE'
        }
      }),
      
      // Content generated this month
      db.content.count({
        where: {
          campaign: {
            client: { agencyId }
          },
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Content generated last month (for growth calculation)
      db.content.count({
        where: {
          campaign: {
            client: { agencyId }
          },
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ])

    // Calculate growth rate
    const growthRate = lastMonthContent > 0 
      ? Math.round(((monthlyContent - lastMonthContent) / lastMonthContent) * 100)
      : monthlyContent > 0 ? 100 : 0

    // Mock revenue data (in a real app, this would come from billing/payment records)
    const monthlyRevenue = Math.floor(Math.random() * 10000) + 5000
    
    const metrics = {
      totalClients,
      activeClients,
      totalCampaigns,
      activeCampaigns,
      totalContent: monthlyContent,
      monthlyRevenue,
      growthRate
    }

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}