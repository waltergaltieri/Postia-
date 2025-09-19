import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/generated/prisma';
import { 
  ClientContext,
  createClientContext,
  validateClientAccess,
  parseAssignedClientIds,
  ClientAccessError,
  ClientDataIsolationError,
  addClientFilter
} from '@/lib/client-isolation';
import { db } from '@/lib/db';

/**
 * Extended NextRequest with client context
 */
export interface NextRequestWithClientContext extends NextRequest {
  clientContext?: ClientContext;
  userContext?: {
    id: string;
    role: UserRole;
    agencyId: string;
    assignedClientIds: string[];
  };
}

/**
 * Client isolation middleware options
 */
export interface ClientIsolationOptions {
  requireClientId?: boolean;
  clientIdSource?: 'header' | 'query' | 'path' | 'body';
  clientIdParam?: string;
  allowAdminAccess?: boolean;
  requirePermissions?: string[];
}

/**
 * Default options for client isolation middleware
 */
const DEFAULT_OPTIONS: ClientIsolationOptions = {
  requireClientId: true,
  clientIdSource: 'header',
  clientIdParam: 'x-client-id',
  allowAdminAccess: false,
  requirePermissions: [],
};

/**
 * Middleware for client data isolation
 */
export function withClientIsolation(
  handler: (request: NextRequestWithClientContext, ...args: any[]) => Promise<NextResponse>,
  options: Partial<ClientIsolationOptions> = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequestWithClientContext, ...args: any[]): Promise<NextResponse> => {
    try {
      // Get session
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

      // Get user's assigned clients
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { assignedClients: true },
      });

      const assignedClientIds = parseAssignedClientIds(user?.assignedClients || null);

      // Add user context to request
      request.userContext = {
        id: userId,
        role: userRole,
        agencyId,
        assignedClientIds,
      };

      // Extract client ID from request
      const clientId = extractClientId(request, opts);

      // Handle admin access (no specific client context)
      if (!clientId && opts.allowAdminAccess) {
        // For admin routes, we don't need client context
        return handler(request, ...args);
      }

      // Validate client ID requirement
      if (opts.requireClientId && !clientId) {
        return NextResponse.json(
          { error: { message: 'Client ID is required' } },
          { status: 400 }
        );
      }

      // If client ID is provided, validate access and create context
      if (clientId) {
        // Validate client access
        const hasAccess = await validateClientAccess(userId, userRole, clientId);
        
        if (!hasAccess) {
          return NextResponse.json(
            { error: { message: 'Access denied to client' } },
            { status: 403 }
          );
        }

        // Create client context
        const clientContext = await createClientContext(userId, clientId);
        
        if (!clientContext) {
          return NextResponse.json(
            { error: { message: 'Failed to create client context' } },
            { status: 500 }
          );
        }

        // Add client context to request
        request.clientContext = clientContext;
      }

      // Call the handler
      return handler(request, ...args);
    } catch (error) {
      console.error('Client isolation middleware error:', error);

      if (error instanceof ClientAccessError) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: 403 }
        );
      }

      if (error instanceof ClientDataIsolationError) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: { message: 'Internal server error' } },
        { status: 500 }
      );
    }
  };
}

/**
 * Extract client ID from request based on options
 */
function extractClientId(
  request: NextRequestWithClientContext,
  options: ClientIsolationOptions
): string | null {
  const { clientIdSource, clientIdParam } = options;

  switch (clientIdSource) {
    case 'header':
      return request.headers.get(clientIdParam!) || null;
    
    case 'query':
      const url = new URL(request.url);
      return url.searchParams.get(clientIdParam!) || null;
    
    case 'path':
      // Extract from URL path (e.g., /api/clients/[clientId]/campaigns)
      const pathParts = new URL(request.url).pathname.split('/');
      const clientIndex = pathParts.findIndex(part => part === 'clients');
      if (clientIndex !== -1 && pathParts[clientIndex + 1]) {
        return pathParts[clientIndex + 1];
      }
      return null;
    
    case 'body':
      // This would require parsing the body, which is more complex
      // For now, return null and handle in the route handler
      return null;
    
    default:
      return null;
  }
}

/**
 * Database query helpers with automatic client filtering
 */
export class ClientIsolatedQueries {
  private userContext: {
    id: string;
    role: UserRole;
    agencyId: string;
    assignedClientIds: string[];
  };

  constructor(userContext: {
    id: string;
    role: UserRole;
    agencyId: string;
    assignedClientIds: string[];
  }) {
    this.userContext = userContext;
  }

  /**
   * Get clients with automatic filtering
   */
  async getClients(additionalWhere: any = {}) {
    const baseWhere = {
      agencyId: this.userContext.agencyId,
      ...additionalWhere,
    };

    // Apply client filtering for collaborators
    if (this.userContext.role === UserRole.COLLABORATOR) {
      baseWhere.id = { in: this.userContext.assignedClientIds };
    }

    return db.client.findMany({
      where: baseWhere,
    });
  }

  /**
   * Get campaigns with automatic client filtering
   */
  async getCampaigns(additionalWhere: any = {}) {
    const baseWhere = {
      agencyId: this.userContext.agencyId,
      ...additionalWhere,
    };

    // Apply client filtering for collaborators
    if (this.userContext.role === UserRole.COLLABORATOR) {
      baseWhere.clientId = { in: this.userContext.assignedClientIds };
    }

    return db.campaign.findMany({
      where: baseWhere,
    });
  }

  /**
   * Get content jobs with automatic client filtering
   */
  async getContentJobs(additionalWhere: any = {}) {
    const baseWhere = {
      agencyId: this.userContext.agencyId,
      ...additionalWhere,
    };

    // Apply client filtering for collaborators
    if (this.userContext.role === UserRole.COLLABORATOR) {
      baseWhere.clientId = { in: this.userContext.assignedClientIds };
    }

    return db.contentJob.findMany({
      where: baseWhere,
    });
  }

  /**
   * Generic query with client filtering
   */
  getClientFilter() {
    return addClientFilter(
      this.userContext.role,
      this.userContext.assignedClientIds,
      this.userContext.agencyId
    );
  }

  /**
   * Validate client access for this user
   */
  canAccessClient(clientId: string): boolean {
    if (this.userContext.role === UserRole.OWNER || this.userContext.role === UserRole.MANAGER) {
      return true;
    }
    return this.userContext.assignedClientIds.includes(clientId);
  }

  /**
   * Get accessible client IDs
   */
  getAccessibleClientIds(): string[] {
    return this.userContext.assignedClientIds;
  }
}

/**
 * Helper to create client isolated queries from request
 */
export function createClientIsolatedQueries(
  request: NextRequestWithClientContext
): ClientIsolatedQueries | null {
  if (!request.userContext) {
    return null;
  }
  return new ClientIsolatedQueries(request.userContext);
}

/**
 * Middleware specifically for client-specific routes (e.g., /api/clients/[clientId]/*)
 */
export function withClientSpecificIsolation(
  handler: (request: NextRequestWithClientContext, ...args: any[]) => Promise<NextResponse>
) {
  return withClientIsolation(handler, {
    requireClientId: true,
    clientIdSource: 'path',
    allowAdminAccess: false,
  });
}

/**
 * Middleware for admin routes that can access all clients
 */
export function withAdminClientAccess(
  handler: (request: NextRequestWithClientContext, ...args: any[]) => Promise<NextResponse>
) {
  return withClientIsolation(handler, {
    requireClientId: false,
    allowAdminAccess: true,
  });
}

/**
 * Middleware for routes that accept optional client context
 */
export function withOptionalClientIsolation(
  handler: (request: NextRequestWithClientContext, ...args: any[]) => Promise<NextResponse>
) {
  return withClientIsolation(handler, {
    requireClientId: false,
    clientIdSource: 'header',
    allowAdminAccess: true,
  });
}

/**
 * Validate request has required client context
 */
export function requireClientContext(
  request: NextRequestWithClientContext
): ClientContext {
  if (!request.clientContext) {
    throw new ClientDataIsolationError('Client context is required but not found');
  }
  return request.clientContext;
}

/**
 * Validate request has user context
 */
export function requireUserContext(
  request: NextRequestWithClientContext
): NonNullable<NextRequestWithClientContext['userContext']> {
  if (!request.userContext) {
    throw new ClientDataIsolationError('User context is required but not found');
  }
  return request.userContext;
}

/**
 * Helper to extract client ID from various sources
 */
export function getClientIdFromRequest(
  request: NextRequestWithClientContext,
  source: 'header' | 'query' | 'path' = 'header',
  param: string = 'x-client-id'
): string | null {
  return extractClientId(request, { clientIdSource: source, clientIdParam: param });
}