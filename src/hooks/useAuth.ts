import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hasPermission, canAccessClientSync } from '@/lib/permissions';
import type { UserRole } from '@/generated/prisma';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, requireAuth, router]);

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    session,
  };
}

export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const checkClientAccess = (clientId: string, assignedClientIds: string[] = []): boolean => {
    if (!user?.role) return false;
    return canAccessClientSync(user.role as UserRole, assignedClientIds, clientId);
  };

  return {
    checkPermission,
    checkClientAccess,
    userRole: user?.role as UserRole,
    agencyId: user?.agencyId,
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return { isLoading: true, isAuthenticated: false };
  }
  
  if (!isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return { isLoading: false, isAuthenticated: true };
}

export function useRequirePermission(permission: string) {
  const { checkPermission } = usePermissions();
  const hasRequiredPermission = checkPermission(permission);
  
  if (!hasRequiredPermission) {
    throw new Error(`Permission required: ${permission}`);
  }
  
  return hasRequiredPermission;
}

export function useRequireRole(allowedRoles: UserRole[]) {
  const { userRole } = usePermissions();
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error(`Role required: ${allowedRoles.join(', ')}`);
  }
  
  return userRole;
}