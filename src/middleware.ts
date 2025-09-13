import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';

// Define protected routes and their required permissions
const PROTECTED_ROUTES: Record<string, { 
  requireAuth: boolean; 
  roles?: string[]; 
  requireEmailVerification?: boolean;
}> = {
  // Dashboard routes
  '/dashboard': { requireAuth: true },
  '/dashboard/clients': { requireAuth: true },
  '/dashboard/campaigns': { requireAuth: true },
  '/dashboard/content': { requireAuth: true },
  '/dashboard/analytics': { requireAuth: true },
  
  // Admin routes (Owner only)
  '/dashboard/agency': { requireAuth: true, roles: ['OWNER'], requireEmailVerification: true },
  '/dashboard/users': { requireAuth: true, roles: ['OWNER', 'MANAGER'], requireEmailVerification: true },
  '/dashboard/settings': { requireAuth: true, roles: ['OWNER'], requireEmailVerification: true },
  
  // API routes
  '/api/agencies': { requireAuth: true },
  '/api/clients': { requireAuth: true },
  '/api/campaigns': { requireAuth: true },
  '/api/content': { requireAuth: true },
  '/api/users': { requireAuth: true, roles: ['OWNER', 'MANAGER'], requireEmailVerification: true },
  '/api/invitations': { requireAuth: true, roles: ['OWNER', 'MANAGER'], requireEmailVerification: true },
  
  // Sensitive operations
  '/api/auth/forgot-password': { requireAuth: false },
  '/api/auth/reset-password': { requireAuth: false },
  '/api/auth/verify-email': { requireAuth: false },
  '/api/auth/resend-verification': { requireAuth: false },
};

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Check if route requires authentication
    const routeConfig = Object.entries(PROTECTED_ROUTES).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (!routeConfig?.requireAuth) {
      return NextResponse.next();
    }

    // Check if user has required role
    if (routeConfig.roles && token?.role && !routeConfig.roles.includes(token.role)) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', req.url));
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