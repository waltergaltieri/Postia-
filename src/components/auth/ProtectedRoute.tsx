'use client';

import { useAuth, usePermissions } from '@/hooks/useAuth';
import { UserRole } from '@/generated/prisma';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import EmailVerificationRequired from './EmailVerificationRequired';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  allowedRoles?: UserRole[];
  requireEmailVerification?: boolean;
  fallback?: ReactNode;
  unauthorizedFallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermission,
  allowedRoles,
  requireEmailVerification = false,
  fallback,
  unauthorizedFallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth(requireAuth);
  const { checkPermission, userRole } = usePermissions();
  const pathname = usePathname();

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-info-600"></div>
        </div>
      )
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return (
      unauthorizedFallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access this page.
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-info-600 hover:bg-info-700"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    );
  }

  // Check role-based access
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      unauthorizedFallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-info-600 hover:bg-info-700"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      )
    );
  }

  // Check permission-based access
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return (
      unauthorizedFallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Insufficient Permissions
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have the required permissions to access this page.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-info-600 hover:bg-info-700"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      )
    );
  }

  // Check email verification for sensitive routes
  const sensitiveRoutes = ['/dashboard/agency', '/dashboard/users'];
  const needsEmailVerification = requireEmailVerification || 
    sensitiveRoutes.some(route => pathname.startsWith(route));

  if (isAuthenticated && needsEmailVerification && !user?.emailVerified) {
    return <EmailVerificationRequired />;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function OwnerOnly({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerOrOwner({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.MANAGER]}>
      {children}
    </ProtectedRoute>
  );
}

export function RequirePermission({ 
  permission, 
  children 
}: { 
  permission: string; 
  children: ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermission={permission}>
      {children}
    </ProtectedRoute>
  );
}