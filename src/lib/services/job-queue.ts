import { db } from '@/lib/db';
import { JobStatus, GenerationStep, StepStatus } from '@/generated/prisma';

export interface JobData {
  campaignId: string;
  clientId: string;
  agencyId: string;
  userId: string;
  steps: GenerationStep[];
  context: {
    brandName: string;
    industry?: string;
    targetAudience?: string;
    campaignGoals?: string;
    brandGuidelines?: string;
    platforms?: string[];
    brandAssets?: Array<{
      type: string;
      name: string;
      url: string;
      metadata?: any;
    }>;
  };
  options?: {
    regenerateStep?: GenerationStep;
    customPrompts?: Record<string, string>;
    imageVariations?: number;
    imageQuality?: 'standard' | 'hd' | 'ultra';
  };
}

export interface StepResult {
  step: GenerationStep;
  status: StepStatus;
  result?: any;
  error?: string;
  usage?: {
    tokens?: number;
    cost?: number;
  };
  startedAt: Date;
  completedAt?: Date;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  steps: StepResult[];
  totalCost: number;
  totalTokens: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Create a new content generation job
 */
export async function createContentGenerationJob(data: JobData): Promise<string> {
  try {
    const job = await db.generationJob.create({
      data: {
        campaignId: data.campaignId,
        clientId: data.clientId,
        agencyId: data.agencyId,
        userId: data.userId,
        status: JobStatus.PENDING,
        steps: data.steps,
        context: data.context,
        options: data.options || {},
      },
    });

    // Create step records
    for (const step of data.steps) {
      await db.generationStep.create({
        data: {
          jobId: job.id,
          step,
          status: StepStatus.PENDING,
          order: data.steps.indexOf(step),
        },
      });
    }

    // Start processing the job asynchronously
    processJobAsync(job.id).catch(error => {
      console.error(`Failed to process job ${job.id}:`, error);
    });

    return job.id;
  } catch (error) {
    console.error('Failed to create generation job:', error);
    throw new Error('Failed to create content generation job');
  }
}

/**
 * Process a job asynchronously
 */
async function processJobAsync(jobId: string): Promise<void> {
  try {
    // Update job status to in progress
    await db.generationJob.update({
      where: { id: jobId },
      data: { 
        status: JobStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    const job = await db.generationJob.findUnique({
      where: { id: jobId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    const stepResults: Record<string, any> = {};
    let totalCost = 0;
    let totalTokens = 0;

    // Process each step in order
    for (const stepRecord of job.steps) {
      try {
        // Update step status to in progress
        await db.generationStep.update({
          where: { id: stepRecord.id },
          data: { 
            status: StepStatus.IN_PROGRESS,
            startedAt: new Date(),
          },
        });

        // Process the step
        const result = await processGenerationStep(
          stepRecord.step,
          job,
          stepResults
        );

        // Update step with result
        await db.generationStep.update({
          where: { id: stepRecord.id },
          data: {
            status: StepStatus.COMPLETED,
            result: result.data,
            usage: result.usage,
            completedAt: new Date(),
          },
        });

        stepResults[stepRecord.step] = result.data;
        totalCost += result.usage?.cost || 0;
        totalTokens += result.usage?.tokens || 0;

      } catch (error) {
        console.error(`Step ${stepRecord.step} failed:`, error);
        
        // Update step with error
        await db.generationStep.update({
          where: { id: stepRecord.id },
          data: {
            status: StepStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });

        // If a step fails, mark the entire job as failed
        await db.generationJob.update({
          where: { id: jobId },
          data: {
            status: JobStatus.FAILED,
            error: `Step ${stepRecord.step} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            completedAt: new Date(),
            totalCost,
            totalTokens,
          },
        });

        return;
      }
    }

    // Mark job as completed
    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        totalCost,
        totalTokens,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: job.agencyId,
        userId: job.userId,
        action: 'COMPLETE',
        resource: 'GENERATION_JOB',
        resourceId: jobId,
        details: {
          campaignId: job.campaignId,
          steps: job.steps.map(s => s.step),
          totalCost,
          totalTokens,
        },
      },
    });

  } catch (error) {
    console.error(`Job ${jobId} processing failed:`, error);
    
    // Mark job as failed
    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Process a single generation step using the enhanced workflow engine
 */
async function processGenerationStep(
  step: GenerationStep,
  job: any,
  previousResults: Record<string, any>
): Promise<{ data: any; usage: { tokens: number; cost: number } }> {
  const { executeContentWorkflow, WorkflowEngine } = await import('./workflow-engine');

  // Build workflow context
  const context = {
    jobId: job.id,
    campaignId: job.campaignId,
    clientId: job.clientId,
    agencyId: job.agencyId,
    userId: job.userId,
    brand: {
      brandName: job.context.brandName,
      industry: job.context.industry,
      targetAudience: job.context.targetAudience,
      brandGuidelines: job.context.brandGuidelines,
      brandAssets: job.context.brandAssets || [],
    },
    campaign: {
      name: job.context.campaignName || 'Content Generation',
      description: job.context.campaignDescription,
      platforms: job.context.platforms || ['FACEBOOK'],
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      postsPerWeek: 3,
      targetAudience: job.context.targetAudience,
      campaignGoals: job.context.campaignGoals,
      brandGuidelines: job.context.brandGuidelines,
    },
    options: job.options || {},
  };

  // Create workflow engine instance
  const engine = new (await import('./workflow-engine')).WorkflowEngine(context);
  
  // Set previous results
  engine['stepResults'] = previousResults;

  // Execute single step
  const result = await engine.executeStep(step);

  if (result.status !== 'COMPLETED') {
    throw new Error(result.error || `Step ${step} failed`);
  }

  return {
    data: result.content,
    usage: {
      tokens: result.usage?.tokens || 0,
      cost: result.usage?.cost || 0,
    },
  };
}

/**
 * Get job status and results
 */
export async function getJobStatus(jobId: string): Promise<JobResult | null> {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: {
      steps: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!job) {
    return null;
  }

  const steps: StepResult[] = job.steps.map(step => ({
    step: step.step,
    status: step.status,
    result: step.result,
    error: step.error,
    usage: step.usage as any,
    startedAt: step.startedAt || job.createdAt,
    completedAt: step.completedAt || undefined,
  }));

  return {
    jobId: job.id,
    status: job.status,
    steps,
    totalCost: job.totalCost || 0,
    totalTokens: job.totalTokens || 0,
    startedAt: job.startedAt || job.createdAt,
    completedAt: job.completedAt || undefined,
    error: job.error,
  };
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string, userId: string): Promise<void> {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
    throw new Error('Cannot cancel completed or failed job');
  }

  await db.generationJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.FAILED,
      error: 'Cancelled by user',
      completedAt: new Date(),
    },
  });

  // Update any pending steps
  await db.generationStep.updateMany({
    where: {
      jobId,
      status: { in: [StepStatus.PENDING, StepStatus.IN_PROGRESS] },
    },
    data: {
      status: StepStatus.FAILED,
      error: 'Job cancelled',
      completedAt: new Date(),
    },
  });
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<void> {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: {
      steps: true,
    },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== JobStatus.FAILED) {
    throw new Error('Can only retry failed jobs');
  }

  // Reset job status
  await db.generationJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.PENDING,
      error: null,
      startedAt: null,
      completedAt: null,
      totalCost: 0,
      totalTokens: 0,
    },
  });

  // Reset failed steps
  await db.generationStep.updateMany({
    where: {
      jobId,
      status: StepStatus.FAILED,
    },
    data: {
      status: StepStatus.PENDING,
      error: null,
      result: null,
      usage: null,
      startedAt: null,
      completedAt: null,
    },
  });

  // Start processing again
  processJobAsync(jobId).catch(error => {
    console.error(`Failed to retry job ${jobId}:`, error);
  });
}

/**
 * Get jobs for a campaign
 */
export async function getCampaignJobs(campaignId: string): Promise<JobResult[]> {
  const jobs = await db.generationJob.findMany({
    where: { campaignId },
    include: {
      steps: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return jobs.map(job => ({
    jobId: job.id,
    status: job.status,
    steps: job.steps.map(step => ({
      step: step.step,
      status: step.status,
      result: step.result,
      error: step.error,
      usage: step.usage as any,
      startedAt: step.startedAt || job.createdAt,
      completedAt: step.completedAt || undefined,
    })),
    totalCost: job.totalCost || 0,
    totalTokens: job.totalTokens || 0,
    startedAt: job.startedAt || job.createdAt,
    completedAt: job.completedAt || undefined,
    error: job.error,
  }));
}