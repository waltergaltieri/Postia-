import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole, GenerationStep } from '@/generated/prisma';
import { db } from '@/lib/db';
import { regenerateWorkflowStep } from '@/lib/services/workflow-engine';

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

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.REGENERATE_CONTENT)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to regenerate content' } },
        { status: 403 }
      );
    }

    const { jobId } = params;
    const { step, reason, customPrompt, options = {} } = await request.json();

    // Validate step
    if (!step || !Object.values(GenerationStep).includes(step)) {
      return NextResponse.json(
        { error: { message: 'Valid generation step is required' } },
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

    // Check if job is in a state that allows regeneration
    if (job.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: { message: 'Cannot regenerate steps while job is in progress' } },
        { status: 400 }
      );
    }

    // Check token balance for regeneration
    const agency = await db.agency.findUnique({
      where: { id: session.user.agencyId },
      select: { tokenBalance: true },
    });

    if (!agency) {
      return NextResponse.json(
        { error: { message: 'Agency not found' } },
        { status: 404 }
      );
    }

    // Estimate tokens needed for regeneration (rough estimate)
    const estimatedTokens = {
      [GenerationStep.IDEA]: 100,
      [GenerationStep.COPY_DESIGN]: 120,
      [GenerationStep.COPY_PUBLICATION]: 100,
      [GenerationStep.BASE_IMAGE]: 150, // Includes image generation cost
      [GenerationStep.FINAL_DESIGN]: 50,
    };

    const requiredTokens = estimatedTokens[step as GenerationStep] || 100;
    
    if (agency.tokenBalance < requiredTokens) {
      return NextResponse.json(
        { 
          error: { 
            message: 'Insufficient token balance for regeneration',
            details: {
              required: requiredTokens,
              available: agency.tokenBalance,
            },
          } 
        },
        { status: 402 } // Payment Required
      );
    }

    // Update job options if custom prompt provided
    if (customPrompt) {
      const currentOptions = job.options as any || {};
      const updatedOptions = {
        ...currentOptions,
        customPrompts: {
          ...currentOptions.customPrompts,
          [step]: customPrompt,
        },
        ...options,
      };

      await db.generationJob.update({
        where: { id: jobId },
        data: { options: updatedOptions },
      });
    }

    // Regenerate the step
    const result = await regenerateWorkflowStep(jobId, step as GenerationStep, reason);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'REGENERATE',
        resource: 'GENERATION_STEP',
        resourceId: `${jobId}-${step}`,
        details: {
          jobId,
          step,
          reason,
          hasCustomPrompt: !!customPrompt,
          options,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        step: result.step,
        status: result.status,
        content: result.content,
        usage: result.usage,
        metadata: result.metadata,
        message: 'Step regenerated successfully',
      },
    });
  } catch (error) {
    console.error('Regenerate step error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to regenerate step' 
        } 
      },
      { status: 500 }
    );
  }
}