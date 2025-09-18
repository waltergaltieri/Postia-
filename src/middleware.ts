import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { UserRole } from '@/generated/prisma';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// Define protected routes with granular permissions instead of simple roles
const PROTECTED_ROUTES: Record<string, { 
  requireAuth: boolean; 
  permissions?: string[]; 
  requireEmailVerification?: boolean;
}> = {
  // Dashboard routes
  '/dashboard': { requireAuth: true },
  '/dashboard/clients': { requireAuth: true, permissions: [PERMISSIONS.VIEW_ALL_CLIENTS, PERMISSIONS.VIEW_ASSIGNED_CLIENTS] },
  '/dashboard/campaigns': { requireAuth: true, permissions: [PERMISSIONS.VIEW_ALL_CAMPAIGNS, PERMISSIONS.VIEW_ASSIGNED_CAMPAIGNS] },
  '/dashboard/content': { requireAuth: true, permissions: [PERMISSIONS.GENERATE_CONTENT] },
  '/dashboard/analytics': { requireAuth: true, permissions: [PERMISSIONS.VIEW_ANALYTICS] },
  
  // Admin routes (require specific permissions)
  '/dashboard/agency': { requireAuth: true, permissions: [PERMISSIONS.MANAGE_AGENCY], requireEmailVerification: true },
  '/dashboard/users': { requireAuth: true, permissions: [PERMISSIONS.MANAGE_USERS], requireEmailVerification: true },
  '/dashboard/settings': { requireAuth: true, permissions: [PERMISSIONS.MANAGE_AGENCY], requireEmailVerification: true },
  
  // API routes
  '/api/agencies': { requireAuth: true, permissions: [PERMISSIONS.MANAGE_AGENCY] },
  '/api/clients': { requireAuth: true, permissions: [PERMISSIONS.VIEW_ALL_CLIENTS, PERMISSIONS.VIEW_ASSIGNED_CLIENTS] },
  '/api/campaigns': { requireAuth: true, permissions: [PERMISSIONS.VIEW_ALL_CAMPAIGNS, PERMISSIONS.VIEW_ASSIGNED_CAMPAIGNS] },
  '/api/content': { requireAuth: true, permissions: [PERMISSIONS.GENERATE_CONTENT] },
  '/api/users': { requireAuth: true, permissions: [PERMISSIONS.MANAGE_USERS], requireEmailVerification: true },
  '/api/invitations': { requireAuth: true, permissions: [PERMISSIONS.INVITE_USERS], requireEmailVerification: true },
  
  // Public auth routes
  '/api/auth/forgot-password': { requireAuth: false },
  '/api/auth/reset-password': { requireAuth: false },
  '/api/auth/verify-email': { requireAuth: false },
  '/api/auth/resend-verification': { requireAuth: false },
};

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to complete registration page ONLY for users who actually need it
    if (pathname === '/auth/complete-registration' || pathname.startsWith('/api/auth/complete-registration')) {
      // Verify that user actually needs to complete registration
      if (token && (!token.isGoogleUser || (token.agencyId && token.role))) {
        // User doesn't need registration, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Check if user needs to complete registration (only for new Google OAuth users)
    if (token && token.sub && (!token.agencyId || !token.role) && token.isGoogleUser) {
      // Don't redirect if already on auth pages or API routes
      if (!pathname.startsWith('/auth') && !pathname.startsWith('/api/auth')) {
        return NextResponse.redirect(new URL('/auth/complete-registration', req.url));
      }
    }

    // Check if route requires authentication
    const routeConfig = Object.entries(PROTECTED_ROUTES).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (!routeConfig?.requireAuth) {
      return NextResponse.next();
    }

    // Check if user has required permissions
    if (routeConfig.permissions && token?.role) {
      const userRole = token.role as UserRole;
      const hasRequiredPermission = routeConfig.permissions.some(permission => 
        hasPermission(userRole, permission)
      );
      
      if (!hasRequiredPermission) {
        return NextResponse.redirect(new URL('/dashboard/unauthorized', req.url));
      }
    }

    // Check email verification for routes that require it
    if (routeConfig.requireEmailVerification && !token?.emailVerified) {
      // For API routes, return 403
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: { message: 'Email verification required' } },
          { status: 403 }
        );
      }
      // For dashboard routes, redirect to verification page
      return NextResponse.redirect(new URL('/auth/verify-email', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (pathname.startsWith('/auth') || pathname === '/' || pathname.startsWith('/api/auth')) {
          return true;
        }

        // Require authentication for protected routes
        const isProtectedRoute = Object.keys(PROTECTED_ROUTES).some(route =>
          pathname.startsWith(route)
        );

        if (isProtectedRoute) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};