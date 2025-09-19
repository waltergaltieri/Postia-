import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { db } from '../../../../../lib/db'
import { UserRole } from '../../../../../generated/prisma'
import { 
  validateClientAccess, 
  parseClientPermissions,
  ClientAccessError 
} from '../../../../../lib/client-isolation'

interface RouteParams {
  params: {
    clientId: string
  }
}

/**
 * GET /api/clients/[clientId]/permissions
 * Get user's permissions for a specific client
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { clientId } = params

    // Validate client access
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

    // Get user's client permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        clientPermissions: true 
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const userRole = user.role as UserRole
    let permissions: string[] = []

    // Owners have all permissions
    if (userRole === UserRole.OWNER) {
      permissions = [
        'read',
        'write',
        'delete',
        'manage_campaigns',
        'manage_content',
        'manage_settings',
        'view_analytics',
        'export_data'
      ]
    } else {
      // Get client-specific permissions from user data
      const clientPermissions = parseClientPermissions(user.clientPermissions)
      permissions = clientPermissions[clientId] || []
      
      // Add default permissions based on role
      if (userRole === UserRole.MANAGER) {
        permissions = [...new Set([...permissions, 'read', 'write', 'manage_campaigns', 'manage_content', 'view_analytics'])]
      } else if (userRole === UserRole.EDITOR) {
        permissions = [...new Set([...permissions, 'read', 'write', 'manage_content'])]
      } else if (userRole === UserRole.VIEWER) {
        permissions = [...new Set([...permissions, 'read'])]
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId,
        permissions,
        role: userRole
      }
    })
  } catch (error) {
    console.error('Error getting client permissions:', error)
    
    if (error instanceof ClientAccessError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}