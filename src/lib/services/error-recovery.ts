import { db } from '@/lib/db';
import { log } from '@/lib/logging/logger';
import { PostiaError, ErrorCode } from '@/lib/errors';
import { AuditTrailService, AuditAction } from './audit-trail';

export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  SKIP = 'SKIP',
  MANUAL_INTERVENTION = 'MANUAL_INTERVENTION',
  ABORT = 'ABORT',
}

export interface RecoveryConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  fallbackEnabled: boolean;
  manualInterventionThreshold: number;
}

export interface RecoveryContext {
  jobId: string;
  step: string;
  attemptNumber: number;
  error: Error;
  agencyId: string;
  clientId?: string;
  userId?: string;
}

export interface RecoveryResult {
  strategy: RecoveryStrategy;
  success: boolean;
  message: string;
  nextAttemptAt?: Date;
  requiresManualIntervention?: boolean;
  fallbackUsed?: boolean;
}

export class ErrorRecoveryService {
  private static readonly DEFAULT_CONFIG: RecoveryConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    backoffMultiplier: 2,
    fallbackEnabled: true,
    manualInterventionThreshold: 5,
  };

  /**
   * Handle error recovery for content generation jobs
   */
  static async handleJobError(
    context: RecoveryContext,
    config: Partial<RecoveryConfig> = {}
  ): Promise<RecoveryResult> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Log the error occurrence
      log.error(`Job step failed: ${context.step}`, {
        jobId: context.jobId,
        step: context.step,
        attemptNumber: context.attemptNumber,
        error: context.error.message,
        agencyId: context.agencyId,
      });

      // Update job step status
      await this.updateStepStatus(context.jobId, context.step, 'FAILED', context.error.message);

      // Determine recovery strategy
      const strategy = await this.determineRecoveryStrategy(context, fullConfig);
      
      // Execute recovery strategy
      const result = await this.executeRecoveryStrategy(strategy, context, fullConfig);

      // Log recovery attempt
      await AuditTrailService.logContentGeneration(
        AuditAction.CONTENT_REGENERATED,
        context.jobId,
        context.agencyId,
        context.clientId,
        context.userId,
        {
          step: context.step,
          attemptNumber: context.attemptNumber,
          strategy,
          success: result.success,
          error: context.error.message,
        }
      );

      return result;

    } catch (recoveryError) {
      log.error('Error recovery failed', {
        jobId: context.jobId,
        step: context.step,
        originalError: context.error.message,
        recoveryError: (recoveryError as Error).message,
        agencyId: context.agencyId,
      });

      return {
        strategy: RecoveryStrategy.ABORT,
        success: false,
        message: 'Error recovery failed',
        requiresManualIntervention: true,
      };
    }
  }

  /**
   * Determine the best recovery strategy based on error type and context
   */
  private static async determineRecoveryStrategy(
    context: RecoveryContext,
    config: RecoveryConfig
  ): Promise<RecoveryStrategy> {
    const { error, attemptNumber, jobId, step } = context;

    // Check if we've exceeded retry limits
    if (attemptNumber >= config.maxRetries) {
      // Check if manual intervention threshold is reached
      const failureCount = await this.getStepFailureCount(jobId, step);
      if (failureCount >= config.manualInterventionThreshold) {
        return RecoveryStrategy.MANUAL_INTERVENTION;
      }
      
      // Try fallback if available
      if (config.fallbackEnabled && this.hasFallbackOption(step)) {
        return RecoveryStrategy.FALLBACK;
      }
      
      return RecoveryStrategy.ABORT;
    }

    // Analyze error type to determine strategy
    if (error instanceof PostiaError) {
      switch (error.code) {
        case ErrorCode.INSUFFICIENT_TOKENS:
          return RecoveryStrategy.MANUAL_INTERVENTION;
        
        case ErrorCode.RATE_LIMIT_EXCEEDED:
          return RecoveryStrategy.RETRY;
        
        case ErrorCode.EXTERNAL_SERVICE_ERROR:
          // Retry for temporary service issues
          if (this.isTemporaryServiceError(error)) {
            return RecoveryStrategy.RETRY;
          }
          return RecoveryStrategy.FALLBACK;
        
        case ErrorCode.VALIDATION_ERROR:
          // Skip validation errors that are unlikely to resolve
          return RecoveryStrategy.SKIP;
        
        default:
          return RecoveryStrategy.RETRY;
      }
    }

    // Default to retry for unknown errors
    return RecoveryStrategy.RETRY;
  }

  /**
   * Execute the determined recovery strategy
   */
  private static async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    context: RecoveryContext,
    config: RecoveryConfig
  ): Promise<RecoveryResult> {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return this.executeRetry(context, config);
      
      case RecoveryStrategy.FALLBACK:
        return this.executeFallback(context);
      
      case RecoveryStrategy.SKIP:
        return this.executeSkip(context);
      
      case RecoveryStrategy.MANUAL_INTERVENTION:
        return this.executeManualIntervention(context);
      
      case RecoveryStrategy.ABORT:
        return this.executeAbort(context);
      
      default:
        throw new Error(`Unknown recovery strategy: ${strategy}`);
    }
  }

  /**
   * Execute retry strategy
   */
  private static async executeRetry(
    context: RecoveryContext,
    config: RecoveryConfig
  ): Promise<RecoveryResult> {
    const delay = config.retryDelay * Math.pow(config.backoffMultiplier, context.attemptNumber - 1);
    const nextAttemptAt = new Date(Date.now() + delay);

    // Schedule retry
    await this.scheduleRetry(context.jobId, context.step, nextAttemptAt);

    log.info(`Scheduled retry for job step`, {
      jobId: context.jobId,
      step: context.step,
      attemptNumber: context.attemptNumber + 1,
      nextAttemptAt: nextAttemptAt.toISOString(),
      delay,
    });

    return {
      strategy: RecoveryStrategy.RETRY,
      success: true,
      message: `Retry scheduled for ${nextAttemptAt.toISOString()}`,
      nextAttemptAt,
    };
  }

  /**
   * Execute fallback strategy
   */
  private static async executeFallback(context: RecoveryContext): Promise<RecoveryResult> {
    const fallbackResult = await this.executeFallbackLogic(context.jobId, context.step);
    
    if (fallbackResult.success) {
      await this.updateStepStatus(context.jobId, context.step, 'COMPLETED', 'Completed using fallback');
      
      log.info(`Fallback successful for job step`, {
        jobId: context.jobId,
        step: context.step,
        fallbackMethod: fallbackResult.method,
      });

      return {
        strategy: RecoveryStrategy.FALLBACK,
        success: true,
        message: `Fallback completed successfully using ${fallbackResult.method}`,
        fallbackUsed: true,
      };
    }

    return {
      strategy: RecoveryStrategy.FALLBACK,
      success: false,
      message: 'Fallback failed',
      requiresManualIntervention: true,
    };
  }

  /**
   * Execute skip strategy
   */
  private static async executeSkip(context: RecoveryContext): Promise<RecoveryResult> {
    await this.updateStepStatus(context.jobId, context.step, 'COMPLETED', 'Skipped due to error');
    
    log.warn(`Skipped job step due to error`, {
      jobId: context.jobId,
      step: context.step,
      error: context.error.message,
    });

    return {
      strategy: RecoveryStrategy.SKIP,
      success: true,
      message: 'Step skipped due to unrecoverable error',
    };
  }

  /**
   * Execute manual intervention strategy
   */
  private static async executeManualIntervention(context: RecoveryContext): Promise<RecoveryResult> {
    // Mark job as requiring manual intervention
    await db.contentGenerationJob.update({
      where: { id: context.jobId },
      data: { 
        status: 'FAILED',
        brandContext: {
          ...(await this.getJobBrandContext(context.jobId)),
          requiresManualIntervention: true,
          interventionReason: context.error.message,
          failedStep: context.step,
        },
      },
    });

    // Create notification for manual intervention
    await this.createInterventionNotification(context);

    log.warn(`Manual intervention required for job`, {
      jobId: context.jobId,
      step: context.step,
      error: context.error.message,
      agencyId: context.agencyId,
    });

    return {
      strategy: RecoveryStrategy.MANUAL_INTERVENTION,
      success: false,
      message: 'Manual intervention required',
      requiresManualIntervention: true,
    };
  }

  /**
   * Execute abort strategy
   */
  private static async executeAbort(context: RecoveryContext): Promise<RecoveryResult> {
    await db.contentGenerationJob.update({
      where: { id: context.jobId },
      data: { status: 'FAILED' },
    });

    log.error(`Job aborted due to unrecoverable error`, {
      jobId: context.jobId,
      step: context.step,
      error: context.error.message,
      agencyId: context.agencyId,
    });

    return {
      strategy: RecoveryStrategy.ABORT,
      success: false,
      message: 'Job aborted due to unrecoverable error',
    };
  }

  /**
   * Helper methods
   */
  private static async updateStepStatus(
    jobId: string,
    step: string,
    status: string,
    error?: string
  ): Promise<void> {
    await db.generationStepResult.updateMany({
      where: {
        jobId,
        step: step as any,
      },
      data: {
        status: status as any,
        error,
      },
    });
  }

  private static async getStepFailureCount(jobId: string, step: string): Promise<number> {
    return db.generationStepResult.count({
      where: {
        jobId,
        step: step as any,
        status: 'FAILED',
      },
    });
  }

  private static hasFallbackOption(step: string): boolean {
    // Define which steps have fallback options
    const fallbackSteps = ['BASE_IMAGE', 'FINAL_DESIGN', 'COPY_DESIGN'];
    return fallbackSteps.includes(step);
  }

  private static isTemporaryServiceError(error: PostiaError): boolean {
    // Check if error is likely temporary (network, rate limit, etc.)
    const temporaryErrors = [
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
    ];
    return temporaryErrors.includes(error.code);
  }

  private static async scheduleRetry(jobId: string, step: string, nextAttemptAt: Date): Promise<void> {
    // In a real implementation, this would use a job queue like Bull or Agenda
    // For now, we'll update the step with retry information
    await db.generationStepResult.updateMany({
      where: {
        jobId,
        step: step as any,
      },
      data: {
        status: 'PENDING',
        error: null,
        // Store retry information in metadata
        input: {
          retryScheduledAt: nextAttemptAt.toISOString(),
          isRetry: true,
        },
      },
    });
  }

  private static async executeFallbackLogic(jobId: string, step: string): Promise<{ success: boolean; method: string }> {
    // Implement fallback logic for different steps
    switch (step) {
      case 'BASE_IMAGE':
      case 'FINAL_DESIGN':
        // Use template image or stock photo
        return { success: true, method: 'template_image' };
      
      case 'COPY_DESIGN':
        // Use simpler copy generation
        return { success: true, method: 'simple_copy' };
      
      default:
        return { success: false, method: 'none' };
    }
  }

  private static async getJobBrandContext(jobId: string): Promise<any> {
    const job = await db.contentGenerationJob.findUnique({
      where: { id: jobId },
      select: { brandContext: true },
    });
    return job?.brandContext || {};
  }

  private static async createInterventionNotification(context: RecoveryContext): Promise<void> {
    // Create a notification for manual intervention
    // This could be an email, Slack message, or in-app notification
    log.systemEvent('MANUAL_INTERVENTION_REQUIRED', {
      jobId: context.jobId,
      step: context.step,
      agencyId: context.agencyId,
      clientId: context.clientId,
      error: context.error.message,
    });
  }

  /**
   * Get recovery statistics for monitoring
   */
  static async getRecoveryStatistics(agencyId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      agencyId,
      action: AuditAction.CONTENT_REGENERATED,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const recoveryAttempts = await db.auditLog.findMany({
      where,
      select: {
        details: true,
        createdAt: true,
      },
    });

    const stats = {
      totalRecoveryAttempts: recoveryAttempts.length,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      strategiesUsed: {} as Record<string, number>,
      stepFailures: {} as Record<string, number>,
    };

    recoveryAttempts.forEach(attempt => {
      const details = attempt.details as any;
      if (details?.success) {
        stats.successfulRecoveries++;
      } else {
        stats.failedRecoveries++;
      }

      if (details?.strategy) {
        stats.strategiesUsed[details.strategy] = (stats.strategiesUsed[details.strategy] || 0) + 1;
      }

      if (details?.step) {
        stats.stepFailures[details.step] = (stats.stepFailures[details.step] || 0) + 1;
      }
    });

    return stats;
  }
}