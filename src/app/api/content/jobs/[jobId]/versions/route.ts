import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GenerationStep } from '@/generated/prisma';
import { db } from '@/lib/db';
import { 
  getJobVersionHistory, 
  getStepVersionHistory, 
  activateVersion, 
  deleteVersion,
  compareVersions,
  getVersionStatistics 
} from '@/lib/services/content-versioning';

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
    const { searchParams } = new URL(request.url);
    const step = searchParams.get('step') as GenerationStep | null;
    const includeStats = searchParams.get('includeStats') === 'true';

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

    let versionHistory;
    let statistics;

    if (step) {
      // Get version history for specific step
      versionHistory = await getStepVersionHistory(jobId, step);
      if (!versionHistory) {
        return NextResponse.json(
          { error: { message: 'No versions found for this step' } },
          { status: 404 }
        );
      }
    } else {
      // Get version history for all steps
      versionHistory = await getJobVersionHistory(jobId);
    }

    if (includeStats) {
      statistics = await getVersionStatistics(jobId);
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        versionHistory,
        statistics,
      },
    });
  } catch (error) {
    console.error('Get version history error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch version history' 
        } 
      },
      { status: 500 }
    );
  }
}