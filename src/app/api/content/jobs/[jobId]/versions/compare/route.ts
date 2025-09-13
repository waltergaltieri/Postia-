import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { compareVersions } from '@/lib/services/content-versioning';

export async function POST(
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
    const { version1Id, version2Id } = await request.json();

    // Validate input
    if (!version1Id || !version2Id) {
      return NextResponse.json(
        { error: { message: 'Both version IDs are required' } },
        { status: 400 }
      );
    }

    if (version1Id === version2Id) {
      return NextResponse.json(
        { error: { message: 'Cannot compare a version with itself' } },
        { status: 400 }
      );
    }

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

    // Verify both versions belong to the job
    const versions = await db.contentVersion.findMany({
      where: {
        id: { in: [version1Id, version2Id] },
        jobId,
      },
    });

    if (versions.length !== 2) {
      return NextResponse.json(
        { error: { message: 'One or both versions not found in this job' } },
        { status: 404 }
      );
    }

    // Compare versions
    const comparison = await compareVersions(version1Id, version2Id);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'COMPARE',
        resource: 'CONTENT_VERSION',
        resourceId: `${version1Id}-${version2Id}`,
        details: {
          jobId,
          version1Id,
          version2Id,
          step: comparison.step,
          similarity: comparison.similarity,
          differenceCount: comparison.differences.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to compare versions' 
        } 
      },
      { status: 500 }
    );
  }
}