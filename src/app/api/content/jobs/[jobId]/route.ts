import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { getJobStatus, cancelJob, retryJob } from '@/lib/services/job-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { jobId } = params;

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

    // Get detailed job status
    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { error: { message: 'Job status not available' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobStatus,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch job status' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { jobId } = params;
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

    switch (action) {
      case 'cancel':
        await cancelJob(jobId, session.user.id);
        
        // Create audit log
        await db.auditLog.create({
          data: {
            agencyId: session.user.agencyId,
            userId: session.user.id,
            action: 'CANCEL',
            resource: 'GENERATION_JOB',
            resourceId: jobId,
            details: {
              reason: 'User cancelled',
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: { message: 'Job cancelled successfully' },
        });

      case 'retry':
        // Check permissions for retry
        if (!hasPermission(session.user.role as UserRole, PERMISSIONS.GENERATE_CONTENT)) {
          return NextResponse.json(
            { error: { message: 'Insufficient permissions to retry job' } },
            { status: 403 }
          );
        }

        await retryJob(jobId);
        
        // Create audit log
        await db.auditLog.create({
          data: {
            agencyId: session.user.agencyId,
            userId: session.user.id,
            action: 'RETRY',
            resource: 'GENERATION_JOB',
            resourceId: jobId,
            details: {
              retriedBy: session.user.id,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: { message: 'Job retry started successfully' },
        });

      default:
        return NextResponse.json(
          { error: { message: 'Invalid action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Job action error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to perform job action' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions - only owners can delete jobs
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_AGENCY)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to delete jobs' } },
        { status: 403 }
      );
    }

    const { jobId } = params;

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

    // Cancel job if it's still running
    if (job.status === 'IN_PROGRESS' || job.status === 'PENDING') {
      await cancelJob(jobId, session.user.id);
    }

    // Delete job and related steps
    await db.$transaction(async (tx) => {
      await tx.generationStep.deleteMany({
        where: { jobId },
      });
      
      await tx.generationJob.delete({
        where: { id: jobId },
      });
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'GENERATION_JOB',
        resourceId: jobId,
        details: {
          deletedJob: {
            campaignId: job.campaignId,
            clientId: job.clientId,
            status: job.status,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Job deleted successfully' },
    });
  } catch (error) {
    console.error('Delete job error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to delete job' 
        } 
      },
      { status: 500 }
    );
  }
}