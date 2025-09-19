import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { AuditTrailService } from '@/lib/services/audit-trail';
import { withErrorHandler } from '@/lib/middleware/error-handler';

async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Check permissions based on role
  const canViewAllAudits = hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_AGENCY);
  const canViewOwnAudits = hasPermission(session.user.role as UserRole, PERMISSIONS.VIEW_ALL_CAMPAIGNS);

  if (!canViewAllAudits && !canViewOwnAudits) {
    return NextResponse.json(
      { error: { message: 'Insufficient permissions to view audit logs' } },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');
  const resourceId = searchParams.get('resourceId');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Get audit trail
    const auditResult = await AuditTrailService.getAuditTrail(
      session.user.agencyId || '',
      resource as any,
      resourceId || undefined,
      limit,
      offset
    );

    // Get audit statistics if user has permission
    let statistics = null;
    if (canViewAllAudits) {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      statistics = await AuditTrailService.getAuditStatistics(
        session.user.agencyId || '',
        start,
        end
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...auditResult,
        statistics,
      },
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch audit logs' 
        } 
      },
      { status: 500 }
    );
  }
}

export { GET };