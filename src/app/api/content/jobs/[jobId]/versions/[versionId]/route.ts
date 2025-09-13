import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { activateVersion, deleteVersion } from '@/lib/services/content-versioning';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { jobId, versionId } = params;
    const { action } = await request.json();

    // Verify job belongs to user's agency
    const job = await db.generationJob.findFirst({
      where: {
        id: jobId,
        agencyId: session.user.agencyId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: { message: 'Job not found or access denied' } },
        { status: 404 }
      );
    }

    // Verify version belongs to the job
    const version = await db.contentVersion.findFirst({
      where: {
        id: versionId,
        jobId,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: { message: 'Version not found' } },
        { status: 404 }
      );
    }

    switch (action) {
      case 'activate':
        // Check permissions for activating versions
        if (!hasPermission(session.user.role as UserRole, PERMISSIONS.APPROVE_CONTENT)) {
          return NextResponse.json(
            { error: { message: 'Insufficient permissions to activate versions' } },
            { status: 403 }
          );
        }

        const activatedVersion = await activateVersion(versionId, session.user.id);

        // Update the corresponding generation step
        await db.generationStep.updateMany({
          where: {
            jobId,
            step: version.step,
          },
          data: {
            result: activatedVersion.content,
          },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            agencyId: session.user.agencyId,
            userId: session.user.id,
            action: 'ACTIVATE',
            resource: 'CONTENT_VERSION',
            resourceId: versionId,
            details: {
              jobId,
              step: version.step,
              version: version.version,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            version: activatedVersion,
            message: 'Version activated successfully',
          },
        });

      default:
        return NextResponse.json(
          { error: { message: 'Invalid action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Version action error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to perform version action' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions for deleting versions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_AGENCY)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to delete versions' } },
        { status: 403 }
      );
    }

    const { jobId, versionId } = params;

    // Verify job belongs to user's agency
    const job = await db.generationJob.findFirst({
      where: {
        id: jobId,
        agencyId: session.user.agencyId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: { message: 'Job not found or access denied' } },
        { status: 404 }
      );
    }

    // Verify version belongs to the job
    const version = await db.contentVersion.findFirst({
      where: {
        id: versionId,
        jobId,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: { message: 'Version not found' } },
        { status: 404 }
      );
    }

    await deleteVersion(versionId, session.user.id);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'CONTENT_VERSION',
        resourceId: versionId,
        details: {
          jobId,
          step: version.step,
          version: version.version,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Version deleted successfully' },
    });
  } catch (error) {
    console.error('Delete version error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to delete version' 
        } 
      },
      { status: 500 }
    );
  }
}