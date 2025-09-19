import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { 
  validateClientAccess,
  parseAssignedClientIds,
  parseClientPermissions,
  validateClientPermission
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

    const { clientId, permission } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: { message: 'Client ID is required' } },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;

    // First check if user has access to the client
    const hasAccess = await validateClientAccess(userId, userRole, clientId);
    
    if (!hasAccess) {
      return NextResponse.json({
        success: true,
        data: {
          hasAccess: false,
          hasPermission: false,
          reason: 'No access to client',
        },
      });
    }

    // If no specific permission is requested, just return access status
    if (!permission) {
      return NextResponse.json({
        success: true,
        data: {
          hasAccess: true,
          hasPermission: true,
          reason: 'Client access granted',
        },
      });
    }

    // Get user's client permissions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { clientPermissions: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    const clientPermissions = parseClientPermissions(user.clientPermissions);
    const hasPermission = validateClientPermission(
      userRole,
      clientPermissions,
      clientId,
      permission
    );

    return NextResponse.json({
      success: true,
      data: {
        hasAccess: true,
        hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Permission denied',
        requestedPermission: permission,
      },
    });
  } catch (error) {
    console.error('Check client permissions error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to check client permissions' 
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;
    const agencyId = session.user.agencyId;

    // Get user's assigned clients and permissions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        assignedClients: true,
        clientPermissions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    const assignedClientIds = parseAssignedClientIds(user.assignedClients);
    const clientPermissions = parseClientPermissions(user.clientPermissions);

    // If specific client is requested
    if (clientId) {
      const hasAccess = await validateClientAccess(userId, userRole, clientId);
      
      if (!hasAccess) {
        return NextResponse.json({
          success: true,
          data: {
            clientId,
            hasAccess: false,
            permissions: [],
            reason: 'No access to client',
          },
        });
      }

      // Get client details
      const client = await db.client.findFirst({
        where: {
          id: clientId,
          agencyId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: { message: 'Client not found' } },
          { status: 404 }
        );
      }

      const permissions = clientPermissions[clientId] || [];

      return NextResponse.json({
        success: true,
        data: {
          clientId,
          clientName: client.name,
          hasAccess: true,
          permissions,
          isOwner: userRole === UserRole.OWNER,
          isManager: userRole === UserRole.MANAGER,
          isActive: client.isActive,
        },
      });
    }

    // Return all accessible clients with permissions
    let accessibleClientIds: string[] = [];
    
    if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
      // Owners and Managers can access all clients in their agency
      const clients = await db.client.findMany({
        where: { agencyId },
        select: { id: true },
      });
      accessibleClientIds = clients.map(client => client.id);
    } else {
      // Collaborators can only access assigned clients
      accessibleClientIds = assignedClientIds;
    }

    // Get client details
    const clients = await db.client.findMany({
      where: {
        id: { in: accessibleClientIds },
        agencyId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Format response with permissions for each client
    const clientsWithPermissions = clients.map(client => ({
      clientId: client.id,
      clientName: client.name,
      hasAccess: true,
      permissions: clientPermissions[client.id] || [],
      isActive: client.isActive,
    }));

    return NextResponse.json({
      success: true,
      data: {
        userRole,
        isOwner: userRole === UserRole.OWNER,
        isManager: userRole === UserRole.MANAGER,
        clients: clientsWithPermissions,
        totalAccessibleClients: accessibleClientIds.length,
      },
    });
  } catch (error) {
    console.error('Get client permissions error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to get client permissions' 
        } 
      },
      { status: 500 }
    );
  }
}