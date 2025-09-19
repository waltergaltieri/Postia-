import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@/generated/prisma'
import { 
  withAdminClientAccess, 
  NextRequestWithClientContext,
  requireUserContext
} from '@/lib/middleware/client-isolation'

interface RouteParams {
  params: {
    clientId: string
  }
}

/**
 * GET /api/admin/clients/[clientId]
 * Get a specific client
 */
async function handleGET(request: NextRequestWithClientContext, { params }: RouteParams) {
  const userContext = requireUserContext(request);

  // Check if user has admin permissions
  if (userContext.role !== UserRole.OWNER && userContext.role !== UserRole.MANAGER) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { clientId } = params

  // Fetch client with detailed information
  const client = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: userContext.agencyId
    },
    include: {
      _count: {
        select: {
          campaigns: true,
          jobs: true,
          clientSessions: true,
        }
      },
      clientSessions: {
        select: {
          userId: true,
          lastAccessed: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { lastAccessed: 'desc' },
        take: 10,
      }
    }
  })

  if (!client) {
    return NextResponse.json(
      { success: false, error: 'Client not found' },
      { status: 404 }
    )
  }

  // Parse JSON fields
  let brandColors = ['#3b82f6'];
  let themeSettings = {};
  let workspaceSettings = {};
  let settings = {};

  if (client.brandColors) {
    try {
      brandColors = JSON.parse(client.brandColors);
    } catch (error) {
      console.warn('Failed to parse brand colors:', error);
    }
  }

  if (client.themeSettings) {
    try {
      themeSettings = JSON.parse(client.themeSettings);
    } catch (error) {
      console.warn('Failed to parse theme settings:', error);
    }
  }

  if (client.workspaceSettings) {
    try {
      workspaceSettings = JSON.parse(client.workspaceSettings);
    } catch (error) {
      console.warn('Failed to parse workspace settings:', error);
    }
  }

  if (client.settings) {
    try {
      settings = JSON.parse(client.settings);
    } catch (error) {
      console.warn('Failed to parse settings:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      client: {
        ...client,
        brandColors,
        themeSettings,
        workspaceSettings,
        settings,
      }
    }
  })
}

/**
 * PATCH /api/admin/clients/[clientId]
 * Update a specific client
 */
async function handlePATCH(request: NextRequestWithClientContext, { params }: RouteParams) {
  const userContext = requireUserContext(request);

  // Check if user has admin permissions
  if (userContext.role !== UserRole.OWNER && userContext.role !== UserRole.MANAGER) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { clientId } = params
  const body = await request.json()

  // Verify client belongs to user's agency
  const existingClient = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: userContext.agencyId
    }
  })

  if (!existingClient) {
    return NextResponse.json(
      { success: false, error: 'Client not found' },
      { status: 404 }
    )
  }

  const {
    name,
    email,
    brandColors,
    logoUrl,
    themeSettings,
    workspaceSettings,
    isActive,
    settings
  } = body

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Invalid email format' },
      { status: 400 }
    )
  }

  // Build update data
  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email?.trim() || null;
  if (brandColors !== undefined) updateData.brandColors = JSON.stringify(brandColors);
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl?.trim() || null;
  if (themeSettings !== undefined) updateData.themeSettings = themeSettings ? JSON.stringify(themeSettings) : null;
  if (workspaceSettings !== undefined) updateData.workspaceSettings = workspaceSettings ? JSON.stringify(workspaceSettings) : null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (settings !== undefined) updateData.settings = settings ? JSON.stringify(settings) : null;

  // Update client
  const updatedClient = await db.client.update({
    where: { id: clientId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      brandColors: true,
      logoUrl: true,
      themeSettings: true,
      workspaceSettings: true,
      isActive: true,
      settings: true,
      createdAt: true,
    }
  })

  // Parse JSON fields for response
  let parsedBrandColors = ['#3b82f6'];
  let parsedThemeSettings = {};
  let parsedWorkspaceSettings = {};
  let parsedSettings = {};

  if (updatedClient.brandColors) {
    try {
      parsedBrandColors = JSON.parse(updatedClient.brandColors);
    } catch (error) {
      console.warn('Failed to parse brand colors:', error);
    }
  }

  if (updatedClient.themeSettings) {
    try {
      parsedThemeSettings = JSON.parse(updatedClient.themeSettings);
    } catch (error) {
      console.warn('Failed to parse theme settings:', error);
    }
  }

  if (updatedClient.workspaceSettings) {
    try {
      parsedWorkspaceSettings = JSON.parse(updatedClient.workspaceSettings);
    } catch (error) {
      console.warn('Failed to parse workspace settings:', error);
    }
  }

  if (updatedClient.settings) {
    try {
      parsedSettings = JSON.parse(updatedClient.settings);
    } catch (error) {
      console.warn('Failed to parse settings:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      client: {
        ...updatedClient,
        brandColors: parsedBrandColors,
        themeSettings: parsedThemeSettings,
        workspaceSettings: parsedWorkspaceSettings,
        settings: parsedSettings,
      }
    }
  })
}

/**
 * DELETE /api/admin/clients/[clientId]
 * Delete a specific client
 */
async function handleDELETE(request: NextRequestWithClientContext, { params }: RouteParams) {
  const userContext = requireUserContext(request);

  // Check if user has admin permissions
  if (userContext.role !== UserRole.OWNER && userContext.role !== UserRole.MANAGER) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { clientId } = params

  // Verify client belongs to user's agency
  const existingClient = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: userContext.agencyId
    }
  })

  if (!existingClient) {
    return NextResponse.json(
      { success: false, error: 'Client not found' },
      { status: 404 }
    )
  }

  // Check if client has active campaigns or content
  const clientUsage = await db.client.findUnique({
    where: { id: clientId },
    select: {
      _count: {
        select: {
          campaigns: true,
          jobs: true,
          clientSessions: true,
        }
      }
    }
  })

  if (clientUsage && (clientUsage._count.campaigns > 0 || clientUsage._count.jobs > 0)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cannot delete client with existing campaigns or jobs. Please remove them first.' 
      },
      { status: 400 }
    )
  }

  // Delete client sessions first (due to foreign key constraints)
  if (clientUsage && clientUsage._count.clientSessions > 0) {
    await db.clientSession.deleteMany({
      where: { clientId }
    });
  }

  // Delete client
  await db.client.delete({
    where: { id: clientId }
  })

  return NextResponse.json({
    success: true,
    message: 'Client deleted successfully'
  })
}

// Export handlers with admin client access middleware
export const GET = withAdminClientAccess(handleGET);
export const PATCH = withAdminClientAccess(handlePATCH);
export const DELETE = withAdminClientAccess(handleDELETE);