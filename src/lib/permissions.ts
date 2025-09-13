import { UserRole } from '../generated/prisma';
import type { Session } from 'next-auth';

// Permission definitions
export const PERMISSIONS = {
  // Agency management
  MANAGE_AGENCY: 'manage_agency',
  VIEW_AGENCY_SETTINGS: 'view_agency_settings',
  MANAGE_SUBSCRIPTION: 'manage_subscription',
  
  // User management
  INVITE_USERS: 'invite_users',
  MANAGE_USERS: 'manage_users',
  ASSIGN_USERS_TO_CLIENTS: 'assign_users_to_clients',
  
  // Client management
  CREATE_CLIENTS: 'create_clients',
  EDIT_ALL_CLIENTS: 'edit_all_clients',
  EDIT_ASSIGNED_CLIENTS: 'edit_assigned_clients',
  DELETE_CLIENTS: 'delete_clients',
  VIEW_ALL_CLIENTS: 'view_all_clients',
  VIEW_ASSIGNED_CLIENTS: 'view_assigned_clients',
  
  // Campaign management
  CREATE_CAMPAIGNS: 'create_campaigns',
  EDIT_ALL_CAMPAIGNS: 'edit_all_campaigns',
  EDIT_ASSIGNED_CAMPAIGNS: 'edit_assigned_campaigns',
  DELETE_CAMPAIGNS: 'delete_campaigns',
  VIEW_ALL_CAMPAIGNS: 'view_all_campaigns',
  VIEW_ASSIGNED_CAMPAIGNS: 'view_assigned_campaigns',
  
  // Content generation
  GENERATE_CONTENT: 'generate_content',
  REGENERATE_CONTENT: 'regenerate_content',
  APPROVE_CONTENT: 'approve_content',
  
  // Publishing
  PUBLISH_CONTENT: 'publish_content',
  SCHEDULE_CONTENT: 'schedule_content',
  
  // Social media
  CONNECT_SOCIAL_ACCOUNTS: 'connect_social_accounts',
  MANAGE_SOCIAL_ACCOUNTS: 'manage_social_accounts',
  
  // Analytics and reporting
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_TOKEN_USAGE: 'view_token_usage',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Brand assets
  UPLOAD_BRAND_ASSETS: 'upload_brand_assets',
  MANAGE_BRAND_ASSETS: 'manage_brand_assets',
} as const;

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.OWNER]: [
    // Agency management
    PERMISSIONS.MANAGE_AGENCY,
    PERMISSIONS.VIEW_AGENCY_SETTINGS,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    
    // User management
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_USERS_TO_CLIENTS,
    
    // Client management
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_ALL_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    
    // Campaign management
    PERMISSIONS.CREATE_CAMPAIGNS,
    PERMISSIONS.EDIT_ALL_CAMPAIGNS,
    PERMISSIONS.DELETE_CAMPAIGNS,
    PERMISSIONS.VIEW_ALL_CAMPAIGNS,
    
    // Content generation
    PERMISSIONS.GENERATE_CONTENT,
    PERMISSIONS.REGENERATE_CONTENT,
    PERMISSIONS.APPROVE_CONTENT,
    
    // Publishing
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.SCHEDULE_CONTENT,
    
    // Social media
    PERMISSIONS.CONNECT_SOCIAL_ACCOUNTS,
    PERMISSIONS.MANAGE_SOCIAL_ACCOUNTS,
    
    // Analytics and reporting
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_TOKEN_USAGE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    
    // Brand assets
    PERMISSIONS.UPLOAD_BRAND_ASSETS,
    PERMISSIONS.MANAGE_BRAND_ASSETS,
  ],
  
  [UserRole.MANAGER]: [
    // User management (limited)
    PERMISSIONS.ASSIGN_USERS_TO_CLIENTS,
    
    // Client management
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_ALL_CLIENTS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    
    // Campaign management
    PERMISSIONS.CREATE_CAMPAIGNS,
    PERMISSIONS.EDIT_ALL_CAMPAIGNS,
    PERMISSIONS.VIEW_ALL_CAMPAIGNS,
    
    // Content generation
    PERMISSIONS.GENERATE_CONTENT,
    PERMISSIONS.REGENERATE_CONTENT,
    PERMISSIONS.APPROVE_CONTENT,
    
    // Publishing
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.SCHEDULE_CONTENT,
    
    // Social media
    PERMISSIONS.CONNECT_SOCIAL_ACCOUNTS,
    PERMISSIONS.MANAGE_SOCIAL_ACCOUNTS,
    
    // Analytics and reporting
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_TOKEN_USAGE,
    
    // Brand assets
    PERMISSIONS.UPLOAD_BRAND_ASSETS,
    PERMISSIONS.MANAGE_BRAND_ASSETS,
  ],
  
  [UserRole.COLLABORATOR]: [
    // Client management (limited)
    PERMISSIONS.EDIT_ASSIGNED_CLIENTS,
    PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
    
    // Campaign management (limited)
    PERMISSIONS.EDIT_ASSIGNED_CAMPAIGNS,
    PERMISSIONS.VIEW_ASSIGNED_CAMPAIGNS,
    
    // Content generation
    PERMISSIONS.GENERATE_CONTENT,
    PERMISSIONS.REGENERATE_CONTENT,
    
    // Publishing (limited)
    PERMISSIONS.SCHEDULE_CONTENT,
    
    // Brand assets (limited)
    PERMISSIONS.UPLOAD_BRAND_ASSETS,
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole] ?? [];
}

/**
 * Check if user can access a specific client (database version)
 */
export async function canAccessClient(
  userId: string,
  userRole: UserRole,
  targetClientId: string
): Promise<boolean> {
  // Import db here to avoid circular dependencies
  const { db } = await import('./db');
  
  // Owners and Managers can access all clients in their agency
  if (userRole === UserRole.OWNER || userRole === UserRole.MANAGER) {
    // Verify client belongs to same agency
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { agencyId: true },
    });
    
    if (!user) return false;
    
    const client = await db.client.findFirst({
      where: {
        id: targetClientId,
        agencyId: user.agencyId,
      },
    });
    
    return !!client;
  }
  
  // Collaborators can only access assigned clients
  const client = await db.client.findFirst({
    where: {
      id: targetClientId,
      assignedUsers: {
        some: {
          id: userId,
        },
      },
    },
  });
  
  return !!client;
}

/**
 * Check if user can access a specific client (sync version with assigned client IDs)
 */
export function canAccessClientSync(
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
 * Check if user can perform action on client
 */
export function canPerformClientAction(
  userRole: UserRole,
  assignedClientIds: string[],
  targetClientId: string,
  action: 'view' | 'edit' | 'delete'
): boolean {
  const canAccess = canAccessClientSync(userRole, assignedClientIds, targetClientId);
  
  if (!canAccess) return false;
  
  switch (action) {
    case 'view':
      return hasAnyPermission(userRole, [
        PERMISSIONS.VIEW_ALL_CLIENTS,
        PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
      ]);
    case 'edit':
      return hasAnyPermission(userRole, [
        PERMISSIONS.EDIT_ALL_CLIENTS,
        PERMISSIONS.EDIT_ASSIGNED_CLIENTS,
      ]);
    case 'delete':
      return hasPermission(userRole, PERMISSIONS.DELETE_CLIENTS);
    default:
      return false;
  }
}

/**
 * Session-based permission checks
 */
export function sessionHasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user?.role) return false;
  return hasPermission(session.user.role, permission);
}

export function sessionCanAccessClient(
  session: Session | null,
  assignedClientIds: string[],
  targetClientId: string
): boolean {
  if (!session?.user?.role) return false;
  return canAccessClientSync(session.user.role, assignedClientIds, targetClientId);
}

/**
 * Middleware helper for API route protection
 */
export function requirePermission(permission: string) {
  return (userRole: UserRole) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error(`Insufficient permissions. Required: ${permission}`);
    }
  };
}

/**
 * Middleware helper for client access protection
 */
export function requireClientAccess(clientId: string, assignedClientIds: string[]) {
  return (userRole: UserRole) => {
    if (!canAccessClientSync(userRole, assignedClientIds, clientId)) {
      throw new Error(`Access denied to client: ${clientId}`);
    }
  };
}