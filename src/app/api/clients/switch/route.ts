import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { 
  validateClientAccess,
  ClientAccessError,
  parseAssignedClientIds
} from '@/lib/client-isolation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.role || !session?.user?.agencyId) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: { message: 'Client ID is required' } },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;
    const agencyId = session.user.agencyId;

    // Validate client access
    const hasAccess = await validateClientAccess(userId, userRole, clientId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Verify client exists and belongs to the same agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        brandColors: true,
        logoUrl: true,
        themeSettings: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found or inactive' } },
        { status: 404 }
      );
    }

    // Update user's last selected client
    await db.user.update({
      where: { id: userId },
      data: { lastSelectedClient: clientId },
    });

    // Create or update client session
    await db.clientSession.upsert({
      where: {
        userId_clientId: {
          userId,
          clientId,
        },
      },
      update: {
        lastAccessed: new Date(),
        sessionData: JSON.stringify({
          switchedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
        }),
      },
      create: {
        userId,
        clientId,
        sessionData: JSON.stringify({
          switchedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
        }),
      },
    });

    // Parse theme settings
    let themeSettings = {};
    if (client.themeSettings) {
      try {
        themeSettings = JSON.parse(client.themeSettings);
      } catch (error) {
        console.warn('Failed to parse client theme settings:', error);
      }
    }

    // Parse brand colors
    let brandColors = ['#3b82f6'];
    if (client.brandColors) {
      try {
        brandColors = JSON.parse(client.brandColors);
      } catch (error) {
        console.warn('Failed to parse client brand colors:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          brandColors,
          logoUrl: client.logoUrl,
          themeSettings,
        },
        message: 'Successfully switched to client',
      },
    });
  } catch (error) {
    console.error('Client switch error:', error);

    if (error instanceof ClientAccessError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to switch client' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.role || !session?.user?.agencyId) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;
    const agencyId = session.user.agencyId;

    // Get user's current client selection and accessible clients
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        lastSelectedClient: true,
        assignedClients: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    // Get accessible client IDs
    let accessibleClientIds: string[] = [];
    
    if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
      // Owners and Managers can access all clients in their agency
      const clients = await db.client.findMany({
        where: { 
          agencyId,
          isActive: true,
        },
        select: { id: true },
      });
      accessibleClientIds = clients.map(client => client.id);
    } else {
      // Collaborators can only access assigned clients
      accessibleClientIds = parseAssignedClientIds(user.assignedClients);
    }

    // Get client details for accessible clients
    const clients = await db.client.findMany({
      where: {
        id: { in: accessibleClientIds },
        agencyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        brandColors: true,
        logoUrl: true,
        themeSettings: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get recent client sessions
    const recentSessions = await db.clientSession.findMany({
      where: {
        userId,
        clientId: { in: accessibleClientIds },
      },
      orderBy: { lastAccessed: 'desc' },
      take: 5,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            brandColors: true,
            logoUrl: true,
          },
        },
      },
    });

    // Format client data
    const formattedClients = clients.map(client => {
      let brandColors = ['#3b82f6'];
      let themeSettings = {};

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

      return {
        id: client.id,
        name: client.name,
        brandColors,
        logoUrl: client.logoUrl,
        themeSettings,
        createdAt: client.createdAt,
      };
    });

    // Format recent sessions
    const formattedRecentSessions = recentSessions.map(session => ({
      clientId: session.client.id,
      clientName: session.client.name,
      logoUrl: session.client.logoUrl,
      lastAccessed: session.lastAccessed,
    }));

    return NextResponse.json({
      success: true,
      data: {
        currentClientId: user.lastSelectedClient,
        accessibleClients: formattedClients,
        recentSessions: formattedRecentSessions,
        userRole,
      },
    });
  } catch (error) {
    console.error('Get client switch data error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to get client switch data' 
        } 
      },
      { status: 500 }
    );
  }
}