import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, GenerationStep } from '@/generated/prisma';
import { db } from '@/lib/db';
import { createContentGenerationJob, JobData } from '@/lib/services/job-queue';
import { estimateTokenUsage } from '@/lib/services/openai';
import { getImageGenerationCost } from '@/lib/services/bananabanana';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.GENERATE_CONTENT)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to generate content' } },
        { status: 403 }
      );
    }

    const {
      campaignId,
      clientId,
      steps = [
        GenerationStep.IDEA,
        GenerationStep.COPY_DESIGN,
        GenerationStep.COPY_PUBLICATION,
        GenerationStep.BASE_IMAGE,
        GenerationStep.FINAL_DESIGN,
      ],
      options = {},
    } = await request.json();

    // Validate required fields
    if (!campaignId || !clientId) {
      return NextResponse.json(
        { error: { message: 'Campaign ID and Client ID are required' } },
        { status: 400 }
      );
    }

    // Validate steps
    const validSteps = Object.values(GenerationStep);
    const invalidSteps = steps.filter((step: string) => !validSteps.includes(step as GenerationStep));
    if (invalidSteps.length > 0) {
      return NextResponse.json(
        { error: { message: `Invalid generation steps: ${invalidSteps.join(', ')}` } },
        { status: 400 }
      );
    }

    // Check if user can access this client
    const hasAccess = await canAccessClient(
      session.user.id,
      session.user.role as UserRole,
      clientId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Get campaign and client details
    const campaign = await db.campaign.findFirst({
      where: {
        id: campaignId,
        clientId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
      include: {
        client: {
          include: {
            brandAssets: {
              select: {
                type: true,
                name: true,
                url: true,
                metadata: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: { message: 'Campaign not found or access denied' } },
        { status: 404 }
      );
    }

    // Estimate costs
    let estimatedTokens = 0;
    let estimatedCost = 0;

    for (const step of steps) {
      if (step === GenerationStep.BASE_IMAGE) {
        const imageCost = getImageGenerationCost(
          options.imageQuality || 'standard',
          options.imageVariations || 1
        );
        estimatedCost += imageCost;
        estimatedTokens += Math.ceil(imageCost * 1000); // Convert to token units
      } else {
        const tokenEstimate = estimateTokenUsage({ step, context: {} as any });
        estimatedTokens += tokenEstimate;
      }
    }

    // Check if agency has sufficient token balance
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

    const requiredTokens = Math.ceil(estimatedTokens / 100); // Convert to internal token units
    if (agency.tokenBalance < requiredTokens) {
      return NextResponse.json(
        { 
          error: { 
            message: 'Insufficient token balance',
            details: {
              required: requiredTokens,
              available: agency.tokenBalance,
              estimated: {
                tokens: estimatedTokens,
                cost: estimatedCost,
              },
            },
          } 
        },
        { status: 402 } // Payment Required
      );
    }

    // Prepare job data
    const jobData: JobData = {
      campaignId,
      clientId,
      agencyId: session.user.agencyId,
      userId: session.user.id,
      steps: steps as GenerationStep[],
      context: {
        brandName: campaign.client.brandName,
        industry: campaign.client.industry,
        targetAudience: campaign.targetAudience,
        campaignGoals: campaign.campaignGoals,
        brandGuidelines: campaign.brandGuidelines,
        platforms: campaign.platforms,
        brandAssets: campaign.client.brandAssets,
      },
      options,
    };

    // Create and start the generation job
    const jobId = await createContentGenerationJob(jobData);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'GENERATION_JOB',
        resourceId: jobId,
        details: {
          campaignId,
          clientId,
          steps,
          estimatedTokens,
          estimatedCost,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        estimatedCost: {
          tokens: estimatedTokens,
          cost: estimatedCost,
        },
        steps,
        message: 'Content generation job started successfully',
      },
    });
  } catch (error) {
    console.error('Generate content error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to start content generation' 
        } 
      },
      { status: 500 }
    );
  }
}