import { UserRole } from '../generated/prisma';
import type { Session } from 'next-auth';
import { db } from './db';

/**
 * Error classes for client access violations
 */
export class ClientAccessError extends Error {
  constructor(userId: string, clientId: string, message?: string) {
    super(message || `User ${userId} does not have access to client ${clientId}`);
    this.name = 'ClientAccessError';
  }
}

export class ClientDataIsolationError extends Error {
  constructor(operation: string, details?: string) {
    super(`Data isolation violation in operation: ${operation}${details ? ` - ${details}` : ''}`);
    this.name = 'ClientDataIsolationError';
  }
}

export class ClientPermissionError extends Error {
  constructor(userId: string, clientId: string, permission: string) {
    super(`User ${userId} lacks permission '${permission}' for client ${clientId}`);
    this.name = 'ClientPermissionError';
  }
}

/**
 * Client access validation utilities
 */

/**
 * Parse assigned client IDs from user data
 */
export function parseAssignedClientIds(assignedClients: string | null): string[] {
  if (!assignedClients) return [];
  try {
    const parsed = JSON.parse(assignedClients);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse client permissions from user data
 */
export function parseClientPermissions(clientPermissions: string | null): Record<string, string[]> {
  if (!clientPermissions) return {};
  try {
    const parsed = JSON.parse(clientPermissions);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Check if user has access to a specific client (synchronous version)
 */
export function validateClientAccessSync(
  userRole: UserRole,
  assignedClientIds: string[],
  targetClientId: string
): boolean {
  // Owners and Managers can access all clients in their agency
  if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
    return true;
  }
  
  // Collaborators can only access assigned clients
  return assignedClientIds.includes(targetClientId);
}

/**
 * Check if user has access to a specific client (async database version)
 */
export async function validateClientAccess(
  userId: string,
  userRole: UserRole,
  targetClientId: string
): Promise<boolean> {
  try {
    // Owners and Managers can access all clients in their agency
    if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
      // Verify client belongs to same agency
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { agencyId: true },
      });
      
      if (!user?.agencyId) return false;
      
      const client = await db.client.findFirst({
        where: {
          id: targetClientId,
          agencyId: user.agencyId,
        },
      });
      
      return !!client;
    }
    
    // Collaborators can only access assigned clients
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { assignedClients: true },
    });
    
    if (!user) return false;
    
    const assignedClientIds = parseAssignedClientIds(user.assignedClients);
    return assignedClientIds.includes(targetClientId);
  } catch (error) {
    console.error('Error validating client access:', error);
    return false;
  }
}

/**
 * Check if user has specific permission for a client
 */
export function validateClientPermission(
  userRole: UserRole,
  clientPermissions: Record<string, string[]>,
  targetClientId: string,
  permission: string
): boolean {
  // Owners have all permissions
  if (userRole === UserRole.OWNER) {
    return true;
  }
  
  // Check client-specific permissions
  const clientPerms = clientPermissions[targetClientId] || [];
  return clientPerms.includes(permission);
}

/**
 * Get all client IDs that a user can access
 */
export async function getUserAccessibleClientIds(
  userId: string,
  userRole: UserRole
): Promise<string[]> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        agencyId: true,
        assignedClients: true,
      },
    });
    
    if (!user?.agencyId) return [];
    
    // Owners and Managers can access all clients in their agency
    if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
      const clients = await db.client.findMany({
        where: { agencyId: user.agencyId },
        select: { id: true },
      });
      return clients.map(client => client.id);
    }
    
    // Collaborators can only access assigned clients
    return parseAssignedClientIds(user.assignedClients);
  } catch (error) {
    console.error('Error getting accessible client IDs:', error);
    return [];
  }
}

/**
 * Validate multiple client access at once
 */
export async function validateMultipleClientAccess(
  userId: string,
  userRole: UserRole,
  clientIds: string[]
): Promise<{ accessible: string[]; denied: string[] }> {
  const accessibleClientIds = await getUserAccessibleClientIds(userId, userRole);
  
  const accessible = clientIds.filter(id => accessibleClientIds.includes(id));
  const denied = clientIds.filter(id => !accessibleClientIds.includes(id));
  
  return { accessible, denied };
}

/**
 * Session-based client access validation
 */
export function validateSessionClientAccess(
  session: Session | null,
  targetClientId: string
): boolean {
  if (!session?.user?.id || !session?.user?.role) {
    return false;
  }
  
  // For session-based validation, we need the assigned clients from the session
  // This should be added to the session in the auth configuration
  const userRole = session.user.role as UserRole;
  
  // Owners and Managers can access all clients (we assume they're in the same agency)
  if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
    return true;
  }
  
  // For collaborators, we need to check assigned clients
  // This requires the session to include assignedClients data
  return false; // Will be enhanced when session includes client data
}

/**
 * Require client access or throw error
 */
export function requireClientAccess(
  userRole: UserRole,
  assignedClientIds: string[],
  targetClientId: string,
  userId?: string
): void {
  if (!validateClientAccessSync(userRole, assignedClientIds, targetClientId)) {
    throw new ClientAccessError(
      userId || 'unknown',
      targetClientId,
      `Access denied to client ${targetClientId}`
    );
  }
}

/**
 * Require client permission or throw error
 */
export function requireClientPermission(
  userRole: UserRole,
  clientPermissions: Record<string, string[]>,
  targetClientId: string,
  permission: string,
  userId?: string
): void {
  if (!validateClientPermission(userRole, clientPermissions, targetClientId, permission)) {
    throw new ClientPermissionError(
      userId || 'unknown',
      targetClientId,
      permission
    );
  }
}

/**
 * Client context type for request objects
 */
export interface ClientContext {
  clientId: string;
  userId: string;
  userRole: UserRole;
  agencyId: string;
  permissions: string[];
}

/**
 * Create client context from user data
 */
export async function createClientContext(
  userId: string,
  clientId: string
): Promise<ClientContext | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        agencyId: true,
        assignedClients: true,
        clientPermissions: true,
      },
    });
    
    if (!user?.agencyId || !user.role) return null;
    
    const userRole = user.role as UserRole;
    const assignedClientIds = parseAssignedClientIds(user.assignedClients);
    
    // Validate access
    if (!validateClientAccessSync(userRole, assignedClientIds, clientId)) {
      return null;
    }
    
    // Get client permissions
    const clientPermissions = parseClientPermissions(user.clientPermissions);
    const permissions = clientPermissions[clientId] || [];
    
    return {
      clientId,
      userId,
      userRole,
      agencyId: user.agencyId,
      permissions,
    };
  } catch (error) {
    console.error('Error creating client context:', error);
    return null;
  }
}

/**
 * Utility to filter data by client access
 */
export function filterByClientAccess<T extends { clientId: string }>(
  data: T[],
  accessibleClientIds: string[]
): T[] {
  return data.filter(item => accessibleClientIds.includes(item.clientId));
}

/**
 * Database query helper to add client filtering
 */
export function addClientFilter(
  userRole: UserRole,
  assignedClientIds: string[],
  agencyId: string
) {
  // Owners and Managers can access all clients in their agency
  if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
    return {
      client: {
        agencyId: agencyId,
      },
    };
  }
  
  // Collaborators can only access assigned clients
  return {
    clientId: {
      in: assignedClientIds,
    },
  };
}

/**
 * Validate client exists and user has access
 */
export async function validateClientExistsAndAccess(
  userId: string,
  userRole: UserRole,
  clientId: string
): Promise<{ client: any; hasAccess: boolean }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { agencyId: true, assignedClients: true },
  });
  
  if (!user?.agencyId) {
    throw new ClientAccessError(userId, clientId, 'User has no agency');
  }
  
  const client = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: user.agencyId,
    },
  });
  
  if (!client) {
    throw new ClientAccessError(userId, clientId, 'Client not found or not in user agency');
  }
  
  const assignedClientIds = parseAssignedClientIds(user.assignedClients);
  const hasAccess = validateClientAccessSync(userRole, assignedClientIds, clientId);
  
  return { client, hasAccess };
}