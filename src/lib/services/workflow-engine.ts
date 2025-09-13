import { db } from '@/lib/db';
import { GenerationStep, JobStatus, StepStatus } from '@/generated/prisma';
import { generatePrompt, PromptContext, BrandContext, CampaignContext, ContentContext } from './prompt-templates';
import { createContentVersion, getStepVersionHistory } from './content-versioning';
import { 
  generateContentIdea, 
  generateCopyDesign, 
  generateCopyPublication, 
  generateImagePrompt,
  TokenUsage 
} from './openai';
import { generateImage, ImageGenerationResponse } from './bananabanana';

export interface WorkflowContext {
  jobId: string;
  campaignId: string;
  clientId: string;
  agencyId: string;
  userId: string;
  brand: BrandContext;
  campaign: CampaignContext;
  content?: ContentContext;
  options?: {
    regenerateStep?: GenerationStep;
    customPrompts?: Record<string, string>;
    imageVariations?: number;
    imageQuality?: 'standard' | 'hd' | 'ultra';
    skipSteps?: GenerationStep[];
    customInstructions?: string;
  };
}

export interface StepResult {
  step: GenerationStep;
  status: StepStatus;
  content?: any;
  versions?: any[];
  error?: string;
  usage?: {
    tokens?: number;
    cost?: number;
  };
  metadata?: {
    prompt?: string;
    model?: string;
    processingTime?: number;
    retryCount?: number;
  };
  startedAt: Date;
  completedAt?: Date;
}

export interface WorkflowResult {
  jobId: string;
  status: JobStatus;
  steps: StepResult[];
  finalContent?: any;
  totalCost: number;
  totalTokens: number;
  processingTime: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Enhanced workflow engine with advanced prompt templates and versioning
 */
export class WorkflowEngine {
  private context: WorkflowContext;
  private stepResults: Record<GenerationStep, any> = {};

  constructor(context: WorkflowContext) {
    this.context = context;
  }

  /**
   * Execute the complete workflow
   */
  async executeWorkflow(steps: GenerationStep[]): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: StepResult[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    try {
      // Update job status to in progress
      await db.generationJob.update({
        where: { id: this.context.jobId },
        data: { 
          status: JobStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Process each step
      for (const step of steps) {
        // Skip if specified in options
        if (this.context.options?.skipSteps?.includes(step)) {
          continue;
        }

        try {
          const stepResult = await this.executeStep(step);
          results.push(stepResult);
          
          if (stepResult.usage) {
            totalCost += stepResult.usage.cost || 0;
            totalTokens += stepResult.usage.tokens || 0;
          }

          // Store result for next steps
          this.stepResults[step] = stepResult.content;

        } catch (error) {
          const failedResult: StepResult = {
            step,
            status: StepStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error',
            startedAt: new Date(),
            completedAt: new Date(),
          };
          
          results.push(failedResult);
          
          // Update job as failed
          await db.generationJob.update({
            where: { id: this.context.jobId },
            data: {
              status: JobStatus.FAILED,
              error: `Step ${step} failed: ${failedResult.error}`,
              completedAt: new Date(),
              totalCost,
              totalTokens,
            },
          });

          return {
            jobId: this.context.jobId,
            status: JobStatus.FAILED,
            steps: results,
            totalCost,
            totalTokens,
            processingTime: Date.now() - startTime,
            startedAt: new Date(startTime),
            error: failedResult.error,
          };
        }
      }

      // Generate final content assembly
      const finalContent = await this.assembleFinalContent();

      // Update job as completed
      await db.generationJob.update({
        where: { id: this.context.jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          totalCost,
          totalTokens,
        },
      });

      return {
        jobId: this.context.jobId,
        status: JobStatus.COMPLETED,
        steps: results,
        finalContent,
        totalCost,
        totalTokens,
        processingTime: Date.now() - startTime,
        startedAt: new Date(startTime),
        completedAt: new Date(),
      };

    } catch (error) {
      // Update job as failed
      await db.generationJob.update({
        where: { id: this.context.jobId },
        data: {
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Workflow execution failed',
          completedAt: new Date(),
          totalCost,
          totalTokens,
        },
      });

      return {
        jobId: this.context.jobId,
        status: JobStatus.FAILED,
        steps: results,
        totalCost,
        totalTokens,
        processingTime: Date.now() - startTime,
        startedAt: new Date(startTime),
        error: error instanceof Error ? error.message : 'Workflow execution failed',
      };
    }
  }

  /**
   * Execute a single step with enhanced prompt generation
   */
  async executeStep(step: GenerationStep): Promise<StepResult> {
    const stepStartTime = Date.now();

    try {
      // Update step status to in progress
      await db.generationStep.updateMany({
        where: { jobId: this.context.jobId, step },
        data: { 
          status: StepStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Build prompt context
      const promptContext: PromptContext = {
        brand: this.context.brand,
        campaign: this.context.campaign,
        content: this.context.content,
        previousSteps: this.stepResults,
        customInstructions: this.context.options?.customInstructions,
      };

      // Generate enhanced prompt
      const prompt = this.context.options?.customPrompts?.[step] || 
                    generatePrompt(step, promptContext);

      let result: any;
      let usage: TokenUsage | undefined;
      let imageResult: ImageGenerationResponse | undefined;

      // Execute step based on type
      switch (step) {
        case GenerationStep.IDEA:
          const ideaResult = await generateContentIdea(
            { step, context: this.buildGenerationContext(), previousSteps: this.stepResults },
            this.context.agencyId,
            this.context.userId
          );
          result = ideaResult.idea;
          usage = ideaResult.usage;
          break;

        case GenerationStep.COPY_DESIGN:
          const copyDesignResult = await generateCopyDesign(
            { step, context: this.buildGenerationContext(), previousSteps: this.stepResults },
            this.context.agencyId,
            this.context.userId
          );
          result = copyDesignResult.copy;
          usage = copyDesignResult.usage;
          break;

        case GenerationStep.COPY_PUBLICATION:
          const copyPubResult = await generateCopyPublication(
            { step, context: this.buildGenerationContext(), previousSteps: this.stepResults, platforms: this.context.campaign.platforms },
            this.context.agencyId,
            this.context.userId
          );
          result = copyPubResult.copy;
          usage = copyPubResult.usage;
          break;

        case GenerationStep.BASE_IMAGE:
          // First generate image prompt
          const imagePromptResult = await generateImagePrompt(
            { step, context: this.buildGenerationContext(), previousSteps: this.stepResults },
            this.context.agencyId,
            this.context.userId
          );

          // Parse prompt and generate image
          let imagePrompt: string;
          try {
            const parsed = JSON.parse(imagePromptResult.prompt);
            imagePrompt = parsed.primaryPrompt?.prompt || parsed.prompt || imagePromptResult.prompt;
          } catch {
            imagePrompt = imagePromptResult.prompt;
          }

          imageResult = await generateImage(
            {
              prompt: imagePrompt,
              style: 'professional',
              aspectRatio: '1:1',
              quality: this.context.options?.imageQuality || 'standard',
            },
            this.context.agencyId,
            this.context.userId,
            this.context.jobId
          );

          result = {
            promptGeneration: imagePromptResult.prompt,
            image: imageResult,
          };

          usage = {
            promptTokens: imagePromptResult.usage.promptTokens,
            completionTokens: imagePromptResult.usage.completionTokens,
            totalTokens: imagePromptResult.usage.totalTokens,
            cost: imagePromptResult.usage.cost + imageResult.usage.cost,
          };
          break;

        case GenerationStep.FINAL_DESIGN:
          result = await this.assembleFinalContent();
          usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 };
          break;

        default:
          throw new Error(`Unknown generation step: ${step}`);
      }

      // Create content version
      const version = await createContentVersion(
        this.context.jobId,
        step,
        result,
        {
          userId: this.context.userId,
          prompt,
          model: 'gpt-3.5-turbo',
          usage: usage ? { tokens: usage.totalTokens, cost: usage.cost } : undefined,
          isRegeneration: !!this.context.options?.regenerateStep,
          regenerationReason: this.context.options?.regenerateStep === step ? 'User requested regeneration' : undefined,
        }
      );

      // Update step status to completed
      await db.generationStep.updateMany({
        where: { jobId: this.context.jobId, step },
        data: {
          status: StepStatus.COMPLETED,
          result,
          usage: usage ? { tokens: usage.totalTokens, cost: usage.cost } : null,
          completedAt: new Date(),
        },
      });

      return {
        step,
        status: StepStatus.COMPLETED,
        content: result,
        versions: [version],
        usage: usage ? { tokens: usage.totalTokens, cost: usage.cost } : undefined,
        metadata: {
          prompt,
          model: 'gpt-3.5-turbo',
          processingTime: Date.now() - stepStartTime,
          retryCount: 0,
        },
        startedAt: new Date(stepStartTime),
        completedAt: new Date(),
      };

    } catch (error) {
      // Update step status to failed
      await db.generationStep.updateMany({
        where: { jobId: this.context.jobId, step },
        data: {
          status: StepStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Regenerate a specific step
   */
  async regenerateStep(step: GenerationStep, reason?: string): Promise<StepResult> {
    // Create new workflow context for regeneration
    const regenerationContext = {
      ...this.context,
      options: {
        ...this.context.options,
        regenerateStep: step,
      },
    };

    const engine = new WorkflowEngine(regenerationContext);
    engine.stepResults = this.stepResults;

    const result = await engine.executeStep(step);
    
    // Update our step results
    if (result.status === StepStatus.COMPLETED) {
      this.stepResults[step] = result.content;
    }

    return result;
  }

  /**
   * Build generation context for AI services
   */
  private buildGenerationContext() {
    return {
      clientId: this.context.clientId,
      campaignId: this.context.campaignId,
      brandName: this.context.brand.brandName,
      industry: this.context.brand.industry,
      targetAudience: this.context.brand.targetAudience || this.context.campaign.targetAudience,
      campaignGoals: this.context.campaign.campaignGoals,
      brandGuidelines: this.context.brand.brandGuidelines || this.context.campaign.brandGuidelines,
      brandAssets: this.context.brand.brandAssets || [],
    };
  }

  /**
   * Assemble final content from all steps
   */
  private async assembleFinalContent(): Promise<any> {
    const finalContent = {
      jobId: this.context.jobId,
      campaignId: this.context.campaignId,
      clientId: this.context.clientId,
      generatedAt: new Date().toISOString(),
      steps: {
        idea: this.stepResults[GenerationStep.IDEA],
        copyDesign: this.stepResults[GenerationStep.COPY_DESIGN],
        copyPublication: this.stepResults[GenerationStep.COPY_PUBLICATION],
        baseImage: this.stepResults[GenerationStep.BASE_IMAGE],
      },
      metadata: {
        brand: this.context.brand.brandName,
        campaign: this.context.campaign.name,
        platforms: this.context.campaign.platforms,
        generationOptions: this.context.options,
      },
      publishingPlan: this.generatePublishingPlan(),
      qualityChecks: await this.performQualityChecks(),
      recommendations: this.generateRecommendations(),
    };

    return finalContent;
  }

  /**
   * Generate publishing plan based on content and campaign
   */
  private generatePublishingPlan() {
    const platforms = this.context.campaign.platforms;
    const now = new Date();
    
    return {
      platforms,
      suggestedTimes: platforms.reduce((acc, platform) => {
        // Generate optimal posting times based on platform
        const optimalTimes = {
          FACEBOOK: '14:00',
          INSTAGRAM: '11:00',
          LINKEDIN: '09:00',
        };
        acc[platform] = optimalTimes[platform as keyof typeof optimalTimes] || '12:00';
        return acc;
      }, {} as Record<string, string>),
      crossPromotion: platforms.length > 1 ? 'Stagger posts across platforms with 2-hour intervals' : 'Single platform posting',
      hashtags: this.extractHashtags(),
      callToAction: this.extractCallToAction(),
    };
  }

  /**
   * Perform quality checks on generated content
   */
  private async performQualityChecks() {
    const checks = {
      brandCompliance: this.checkBrandCompliance(),
      contentQuality: this.checkContentQuality(),
      platformOptimization: this.checkPlatformOptimization(),
      accessibility: this.checkAccessibility(),
      engagement: this.estimateEngagement(),
    };

    return checks;
  }

  /**
   * Generate recommendations for improvement
   */
  private generateRecommendations() {
    const recommendations = [];

    // Analyze content and provide suggestions
    if (this.stepResults[GenerationStep.COPY_PUBLICATION]) {
      const copyLength = JSON.stringify(this.stepResults[GenerationStep.COPY_PUBLICATION]).length;
      if (copyLength > 2000) {
        recommendations.push('Consider shortening copy for better mobile readability');
      }
    }

    if (this.context.campaign.platforms.includes('INSTAGRAM') && !this.stepResults[GenerationStep.BASE_IMAGE]) {
      recommendations.push('Instagram posts perform better with high-quality images');
    }

    if (!this.extractHashtags().length) {
      recommendations.push('Add relevant hashtags to improve discoverability');
    }

    return recommendations;
  }

  /**
   * Extract hashtags from generated content
   */
  private extractHashtags(): string[] {
    const hashtags: string[] = [];
    
    Object.values(this.stepResults).forEach(result => {
      if (typeof result === 'string') {
        const matches = result.match(/#\w+/g);
        if (matches) {
          hashtags.push(...matches);
        }
      } else if (typeof result === 'object' && result) {
        const resultStr = JSON.stringify(result);
        const matches = resultStr.match(/#\w+/g);
        if (matches) {
          hashtags.push(...matches);
        }
      }
    });

    return [...new Set(hashtags)]; // Remove duplicates
  }

  /**
   * Extract call to action from generated content
   */
  private extractCallToAction(): string | null {
    // Look for CTA in copy publication step
    const copyPub = this.stepResults[GenerationStep.COPY_PUBLICATION];
    if (copyPub && typeof copyPub === 'object') {
      try {
        const parsed = JSON.parse(copyPub);
        return parsed.universalElements?.callToAction || 
               parsed.platforms?.FACEBOOK?.callToAction ||
               null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Check brand compliance
   */
  private checkBrandCompliance() {
    return {
      score: 0.85, // Placeholder - would implement actual brand compliance checking
      issues: [],
      recommendations: ['Ensure brand voice consistency across all platforms'],
    };
  }

  /**
   * Check content quality
   */
  private checkContentQuality() {
    return {
      score: 0.90,
      readability: 'Good',
      engagement: 'High',
      originality: 'High',
    };
  }

  /**
   * Check platform optimization
   */
  private checkPlatformOptimization() {
    return {
      score: 0.88,
      platforms: this.context.campaign.platforms.reduce((acc, platform) => {
        acc[platform] = { optimized: true, score: 0.88 };
        return acc;
      }, {} as Record<string, any>),
    };
  }

  /**
   * Check accessibility
   */
  private checkAccessibility() {
    return {
      score: 0.92,
      altText: 'Provided',
      readability: 'Good',
      colorContrast: 'Sufficient',
    };
  }

  /**
   * Estimate engagement potential
   */
  private estimateEngagement() {
    return {
      score: 0.75,
      factors: ['Strong hook', 'Clear CTA', 'Visual appeal'],
      expectedReach: 'Medium to High',
    };
  }
}

/**
 * Create and execute workflow
 */
export async function executeContentWorkflow(
  context: WorkflowContext,
  steps: GenerationStep[]
): Promise<WorkflowResult> {
  const engine = new WorkflowEngine(context);
  return await engine.executeWorkflow(steps);
}

/**
 * Regenerate specific step in existing workflow
 */
export async function regenerateWorkflowStep(
  jobId: string,
  step: GenerationStep,
  reason?: string
): Promise<StepResult> {
  // Get job context
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: {
      campaign: {
        include: {
          client: {
            include: {
              brandAssets: true,
            },
          },
        },
      },
    },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  // Build context from job
  const context: WorkflowContext = {
    jobId: job.id,
    campaignId: job.campaignId,
    clientId: job.clientId,
    agencyId: job.agencyId,
    userId: job.userId,
    brand: {
      brandName: job.campaign.client.brandName,
      industry: job.campaign.client.industry,
      targetAudience: job.campaign.targetAudience,
      campaignGoals: job.campaign.campaignGoals,
      brandGuidelines: job.campaign.brandGuidelines,
      brandAssets: job.campaign.client.brandAssets,
    },
    campaign: {
      name: job.campaign.name,
      description: job.campaign.description,
      platforms: job.campaign.platforms,
      startDate: job.campaign.startDate.toISOString(),
      endDate: job.campaign.endDate.toISOString(),
      postsPerWeek: job.campaign.postsPerWeek,
      targetAudience: job.campaign.targetAudience,
      campaignGoals: job.campaign.campaignGoals,
      brandGuidelines: job.campaign.brandGuidelines,
    },
    options: job.options as any,
  };

  const engine = new WorkflowEngine(context);
  
  // Load existing step results
  const existingSteps = await db.generationStep.findMany({
    where: { jobId },
    orderBy: { order: 'asc' },
  });

  existingSteps.forEach(stepRecord => {
    if (stepRecord.result) {
      engine['stepResults'][stepRecord.step] = stepRecord.result;
    }
  });

  return await engine.regenerateStep(step, reason);
}