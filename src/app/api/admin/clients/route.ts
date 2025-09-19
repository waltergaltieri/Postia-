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

/**
 * GET /api/admin/clients
 * Get all clients for the agency
 */
async function handleGET(request: NextRequestWithClientContext) {
  const userContext = requireUserContext(request);

  // Check if user has admin permissions
  if (userContext.role !== UserRole.OWNER && userContext.role !== UserRole.MANAGER) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status'); // 'active', 'inactive', or null for all
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // Build where clause
  let where: any = { agencyId: userContext.agencyId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  // Fetch clients with counts and pagination
  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        brandColors: true,
        logoUrl: true,
        themeSettings: true,
        workspaceSettings: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            campaigns: true,
            jobs: true,
            clientSessions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    }),
    db.client.count({ where }),
  ]);

  // Format clients with parsed JSON fields
  const formattedClients = clients.map(client => {
    let brandColors = ['#3b82f6'];
    let themeSettings = {};
    let workspaceSettings = {};

    if (client.brandColors) {
      try {
        brandColors = JSON.parse(client.brandColors);
      } catch (error) {
        console.warn('Failed to parse brand colors for client:', client.id);
      }
    }

    if (client.themeSettings) {
      try {
        themeSettings = JSON.parse(client.themeSettings);
      } catch (error) {
        console.warn('Failed to parse theme settings for client:', client.id);
      }
    }

    if (client.workspaceSettings) {
      try {
        workspaceSettings = JSON.parse(client.workspaceSettings);
      } catch (error) {
        console.warn('Failed to parse workspace settings for client:', client.id);
      }
    }

    return {
      ...client,
      brandColors,
      themeSettings,
      workspaceSettings,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  })
}

/**
 * POST /api/admin/clients
 * Create a new client
 */
async function handlePOST(request: NextRequestWithClientContext) {
  const userContext = requireUserContext(request);

  // Check if user has admin permissions
  if (userContext.role !== UserRole.OWNER && userContext.role !== UserRole.MANAGER) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const {
    name,
    email,
    brandColors = ['#3b82f6'],
    logoUrl,
    themeSettings = {},
    workspaceSettings = {},
    isActive = true,
    settings = {}
  } = body

  // Validate required fields
  if (!name) {
    return NextResponse.json(
      { success: false, error: 'Name is required' },
      { status: 400 }
    )
  }

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Invalid email format' },
      { status: 400 }
    )
  }

  // Create client
  const client = await db.client.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      brandColors: JSON.stringify(brandColors),
      logoUrl: logoUrl?.trim() || null,
      themeSettings: Object.keys(themeSettings).length > 0 ? JSON.stringify(themeSettings) : null,
      workspaceSettings: Object.keys(workspaceSettings).length > 0 ? JSON.stringify(workspaceSettings) : null,
      isActive,
      settings: Object.keys(settings).length > 0 ? JSON.stringify(settings) : null,
      agencyId: userContext.agencyId
    },
    select: {
      id: true,
      name: true,
      email: true,
      brandColors: true,
      logoUrl: true,
      themeSettings: true,
      workspaceSettings: true,
      isActive: true,
      createdAt: true,
    }
  })

  // Parse JSON fields for response
  let parsedBrandColors = brandColors;
  let parsedThemeSettings = themeSettings;
  let parsedWorkspaceSettings = workspaceSettings;

  if (client.brandColors) {
    try {
      parsedBrandColors = JSON.parse(client.brandColors);
    } catch (error) {
      console.warn('Failed to parse brand colors:', error);
    }
  }

  if (client.themeSettings) {
    try {
      parsedThemeSettings = JSON.parse(client.themeSettings);
    } catch (error) {
      console.warn('Failed to parse theme settings:', error);
    }
  }

  if (client.workspaceSettings) {
    try {
      parsedWorkspaceSettings = JSON.parse(client.workspaceSettings);
    } catch (error) {
      console.warn('Failed to parse workspace settings:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      client: {
        ...client,
        brandColors: parsedBrandColors,
        themeSettings: parsedThemeSettings,
        workspaceSettings: parsedWorkspaceSettings,
      }
    }
  })
}

// Export handlers with admin client access middleware
export const GET = withAdminClientAccess(handleGET);
export const POST = withAdminClientAccess(handlePOST);