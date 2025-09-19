import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, GenerationStep } from '@/generated/prisma';
import { db } from '@/lib/db';
import { createContentGenerationJob, JobData } from '@/lib/services/job-queue';
import { estimateTokenUsage } from '@/lib/services/openai';
import { getImageGenerationCost } from '@/lib/services/bananabanana';
import { 
  withClientIsolation, 
  NextRequestWithClientContext,
  requireUserContext,
  requireClientContext
} from '@/lib/middleware/client-isolation';

async function handlePOST(request: NextRequestWithClientContext) {
  const userContext = requireUserContext(request);
  const clientContext = requireClientContext(request);

  // Check permissions
  if (!hasPermission(userContext.role, PERMISSIONS.GENERATE_CONTENT)) {
    return NextResponse.json(
      { error: { message: 'Insufficient permissions to generate content' } },
      { status: 403 }
    );
  }

  const {
    campaignId,
    type = 'CAMPAIGN_CONTENT',
    metadata = {},
  } = await request.json();

  // Validate required fields
  if (!campaignId) {
    return NextResponse.json(
      { error: { message: 'Campaign ID is required' } },
      { status: 400 }
    );
  }

  // Get campaign and verify it belongs to the client
  const campaign = await db.campaign.findFirst({
    where: {
      id: campaignId,
      clientId: clientContext.clientId,
      agencyId: userContext.agencyId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          settings: true,
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

  // Check if agency has sufficient token balance
  const agency = await db.agency.findUnique({
    where: { id: userContext.agencyId },
    select: { tokenBalance: true },
  });

  if (!agency) {
    return NextResponse.json(
      { error: { message: 'Agency not found' } },
      { status: 404 }
    );
  }

  const estimatedTokens = 100; // Basic estimation
  if (agency.tokenBalance < estimatedTokens) {
    return NextResponse.json(
      { 
        error: { 
          message: 'Insufficient token balance',
          details: {
            required: estimatedTokens,
            available: agency.tokenBalance,
          },
        } 
      },
      { status: 402 } // Payment Required
    );
  }

  // Create content job
  const job = await db.contentJob.create({
    data: {
      agencyId: userContext.agencyId,
      userId: userContext.id,
      clientId: clientContext.clientId,
      campaignId,
      type,
      status: 'PENDING',
      metadata: JSON.stringify(metadata),
    },
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      message: 'Content generation job started successfully',
    },
  });
}

// Export handler with client isolation middleware
export const POST = withClientIsolation(handlePOST, {
  requireClientId: true,
  clientIdSource: 'body',
});