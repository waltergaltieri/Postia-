import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { UserRole } from '../../../../generated/prisma'
import { validateClientAccess } from '../../../../lib/client-isolation'

/**
 * GET /api/user/client-selection
 * Get user's last selected client
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { lastSelectedClient: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        lastSelectedClient: user?.lastSelectedClient || null
      }
    })
  } catch (error) {
    console.error('Error getting client selection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/client-selection
 * Update user's last selected client
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { clientId } = await request.json()

    // If clientId is null, we're clearing the selection
    if (clientId === null) {
      await db.user.update({
        where: { id: session.user.id },
        data: { lastSelectedClient: null }
      })

      return NextResponse.json({
        success: true,
        data: { lastSelectedClient: null }
      })
    }

    // Validate client access if clientId is provided
    if (clientId) {
      const hasAccess = await validateClientAccess(
        session.user.id,
        session.user.role as UserRole,
        clientId
      )

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to client' },
          { status: 403 }
        )
      }
    }

    // Update user's last selected client
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { lastSelectedClient: clientId }
    })

    // Create or update client session record
    if (clientId) {
      await db.clientSession.upsert({
        where: {
          userId_clientId: {
            userId: session.user.id,
            clientId: clientId
          }
        },
        update: {
          lastAccessed: new Date(),
          sessionData: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || 'unknown'
          })
        },
        create: {
          userId: session.user.id,
          clientId: clientId,
          sessionData: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || 'unknown'
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        lastSelectedClient: updatedUser.lastSelectedClient
      }
    })
  } catch (error) {
    console.error('Error updating client selection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}