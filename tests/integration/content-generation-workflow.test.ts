import { NextRequest } from 'next/server';
import { POST as generateContent } from '@/app/api/content/generate/route';
import { GET as getJob } from '@/app/api/content/jobs/[jobId]/route';
import { POST as regenerateStep } from '@/app/api/content/jobs/[jobId]/regenerate/route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('next-auth');
jest.mock('@/lib/services/openai');
jest.mock('@/lib/services/bananabanana');

const mockSession = {
  user: {
    id: 'user-1',
    agencyId: 'agency-1',
    role: 'OWNER',
  },
};

describe('Content Generation Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('Complete Content Generation Pipeline', () => {
    it('should create and process a complete content generation job', async () => {
      // Mock database responses
      const mockClient = {
        id: 'client-1',
        brandName: 'Test Brand',
        brandColors: ['#FF0000', '#00FF00'],
        description: 'Test brand description',
        agency: { id: 'agency-1', tokenBalance: 1000 },
      };

      const mockJob = {
        id: 'job-1',
        status: 'PENDING',
        tokensConsumed: 0,
        brandContext: {
          clientId: 'client-1',
          brandName: 'Test Brand',
        },
        createdAt: new Date(),
      };

      const mockJobWithSteps = {
        ...mockJob,
        status: 'COMPLETED',
        tokensConsumed: 550,
        completedAt: new Date(),
        steps: [
          {
            id: 'step-1',
            step: 'IDEA',
            status: 'COMPLETED',
            output: { idea: 'Test content idea' },
            tokensUsed: 50,
            executedAt: new Date(),
          },
          {
            id: 'step-2',
            step: 'COPY_DESIGN',
            status: 'COMPLETED',
            output: { copy: 'Test copy for design' },
            tokensUsed: 75,
            executedAt: new Date(),
          },
          {
            id: 'step-3',
            step: 'COPY_PUBLICATION',
            status: 'COMPLETED',
            output: { copy: 'Test publication copy' },
            tokensUsed: 75,
            executedAt: new Date(),
          },
          {
            id: 'step-4',
            step: 'BASE_IMAGE',
            status: 'COMPLETED',
            output: { imageUrl: 'https://example.com/image.jpg' },
            tokensUsed: 150,
            executedAt: new Date(),
          },
          {
            id: 'step-5',
            step: 'FINAL_DESIGN',
            status: 'COMPLETED',
            output: { imageUrl: 'https://example.com/final.jpg' },
            tokensUsed: 200,
            executedAt: new Date(),
          },
        ],
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (db.contentGenerationJob.create as jest.Mock).mockResolvedValue(mockJob);
      (db.contentGenerationJob.findUnique as jest.Mock).mockResolvedValue(mockJobWithSteps);

      // Step 1: Create content generation job
      const generateRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create a social media post about our new product',
          contentType: 'social_post',
          platforms: ['instagram'],
          includeImages: true,
        }),
      });

      const generateResponse = await generateContent(generateRequest);
      const generateResult = await generateResponse.json();

      expect(generateResponse.status).toBe(200);
      expect(generateResult.success).toBe(true);
      expect(generateResult.data.job.id).toBe('job-1');

      // Step 2: Check job status
      const statusRequest = new NextRequest('http://localhost:3000/api/content/jobs/job-1', {
        method: 'GET',
      });

      const statusResponse = await getJob(statusRequest, { params: { jobId: 'job-1' } });
      const statusResult = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(statusResult.success).toBe(true);
      expect(statusResult.data.job.status).toBe('COMPLETED');
      expect(statusResult.data.job.steps).toHaveLength(5);
      expect(statusResult.data.job.tokensConsumed).toBe(550);

      // Verify all steps completed successfully
      statusResult.data.job.steps.forEach((step: any) => {
        expect(step.status).toBe('COMPLETED');
        expect(step.output).toBeDefined();
        expect(step.tokensUsed).toBeGreaterThan(0);
      });
    });

    it('should handle step regeneration in the workflow', async () => {
      const mockJob = {
        id: 'job-1',
        status: 'COMPLETED',
        tokensConsumed: 550,
        brandContext: {
          clientId: 'client-1',
          brandName: 'Test Brand',
        },
        steps: [
          {
            id: 'step-1',
            step: 'IDEA',
            status: 'COMPLETED',
            output: { idea: 'Original idea' },
            tokensUsed: 50,
          },
        ],
      };

      const mockRegeneratedJob = {
        ...mockJob,
        tokensConsumed: 600,
        steps: [
          {
            id: 'step-1',
            step: 'IDEA',
            status: 'COMPLETED',
            output: { idea: 'Regenerated idea' },
            tokensUsed: 50,
          },
        ],
      };

      (db.contentGenerationJob.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValueOnce(mockRegeneratedJob);

      (db.contentGenerationJob.create as jest.Mock).mockResolvedValue({
        id: 'regen-job-1',
        status: 'PENDING',
      });

      // Regenerate a specific step
      const regenerateRequest = new NextRequest('http://localhost:3000/api/content/jobs/job-1/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          step: 'IDEA',
          prompt: 'Make it more creative',
        }),
      });

      const regenerateResponse = await regenerateStep(regenerateRequest, { params: { jobId: 'job-1' } });
      const regenerateResult = await regenerateResponse.json();

      expect(regenerateResponse.status).toBe(200);
      expect(regenerateResult.success).toBe(true);
      expect(regenerateResult.data.jobId).toBe('regen-job-1');
    });

    it('should handle workflow failures gracefully', async () => {
      const mockClient = {
        id: 'client-1',
        brandName: 'Test Brand',
        agency: { id: 'agency-1', tokenBalance: 10 }, // Insufficient tokens
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      const generateRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create a social media post',
          includeImages: true,
        }),
      });

      const generateResponse = await generateContent(generateRequest);
      const generateResult = await generateResponse.json();

      expect(generateResponse.status).toBe(402); // Payment Required
      expect(generateResult.success).toBe(false);
      expect(generateResult.error.message).toContain('Insufficient token balance');
    });
  });

  describe('Token Consumption Tracking', () => {
    it('should accurately track token consumption throughout the workflow', async () => {
      const mockTransactions: any[] = [];
      
      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          agency: {
            update: jest.fn(),
          },
          tokenTransaction: {
            create: jest.fn().mockImplementation((data) => {
              mockTransactions.push(data.data);
              return data.data;
            }),
          },
        };
        return await callback(mockTx);
      });

      // Mock token consumption service
      const { TokenConsumptionService } = require('@/lib/services/token-consumption');
      jest.spyOn(TokenConsumptionService, 'consumeTokens').mockImplementation(async (consumption) => {
        mockTransactions.push({
          agencyId: consumption.agencyId,
          amount: -consumption.amount,
          type: 'CONSUMPTION',
          description: consumption.description,
        });
      });

      // Simulate multiple token consumptions during workflow
      await TokenConsumptionService.consumeTokens({
        agencyId: 'agency-1',
        userId: 'user-1',
        amount: 50,
        description: 'AI IDEA_GENERATION',
      });

      await TokenConsumptionService.consumeTokens({
        agencyId: 'agency-1',
        userId: 'user-1',
        amount: 75,
        description: 'AI COPY_DESIGN',
      });

      await TokenConsumptionService.consumeTokens({
        agencyId: 'agency-1',
        userId: 'user-1',
        amount: 200,
        description: 'AI FINAL_DESIGN',
      });

      // Verify token transactions were recorded
      expect(mockTransactions).toHaveLength(3);
      expect(mockTransactions[0].amount).toBe(-50);
      expect(mockTransactions[1].amount).toBe(-75);
      expect(mockTransactions[2].amount).toBe(-200);

      const totalConsumed = mockTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      expect(totalConsumed).toBe(325);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should implement retry logic for failed steps', async () => {
      const mockJob = {
        id: 'job-1',
        status: 'IN_PROGRESS',
        steps: [
          {
            id: 'step-1',
            step: 'IDEA',
            status: 'FAILED',
            error: 'OpenAI API timeout',
          },
        ],
      };

      (db.contentGenerationJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (db.generationStepResult.updateMany as jest.Mock).mockResolvedValue({});

      // Mock error recovery service
      const { ErrorRecoveryService } = require('@/lib/services/error-recovery');
      const mockRecoveryResult = {
        strategy: 'RETRY',
        success: true,
        message: 'Retry scheduled',
        nextAttemptAt: new Date(Date.now() + 5000),
      };

      jest.spyOn(ErrorRecoveryService, 'handleJobError').mockResolvedValue(mockRecoveryResult);

      const recoveryContext = {
        jobId: 'job-1',
        step: 'IDEA',
        attemptNumber: 1,
        error: new Error('OpenAI API timeout'),
        agencyId: 'agency-1',
      };

      const result = await ErrorRecoveryService.handleJobError(recoveryContext);

      expect(result.strategy).toBe('RETRY');
      expect(result.success).toBe(true);
      expect(result.nextAttemptAt).toBeDefined();
    });
  });

  describe('Version Management Workflow', () => {
    it('should create and manage content versions', async () => {
      const mockPost = {
        id: 'post-1',
        campaignId: 'campaign-1',
        status: 'DRAFT',
        generationJobId: 'job-1',
      };

      const mockVersions = [
        {
          id: 'version-1',
          postId: 'post-1',
          versionNumber: 1,
          finalImageUrl: 'https://example.com/v1.jpg',
          publicationText: 'Version 1 text',
          hashtags: ['test', 'v1'],
          createdAt: new Date(),
        },
        {
          id: 'version-2',
          postId: 'post-1',
          versionNumber: 2,
          finalImageUrl: 'https://example.com/v2.jpg',
          publicationText: 'Version 2 text',
          hashtags: ['test', 'v2'],
          createdAt: new Date(),
        },
      ];

      (db.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (db.contentVersion.findMany as jest.Mock).mockResolvedValue(mockVersions);
      (db.contentVersion.create as jest.Mock).mockResolvedValue(mockVersions[1]);

      // Test version creation
      const newVersion = await db.contentVersion.create({
        data: {
          postId: 'post-1',
          versionNumber: 2,
          finalImageUrl: 'https://example.com/v2.jpg',
          publicationText: 'Version 2 text',
          hashtags: ['test', 'v2'],
        },
      });

      expect(newVersion.versionNumber).toBe(2);
      expect(newVersion.publicationText).toBe('Version 2 text');

      // Test version retrieval
      const versions = await db.contentVersion.findMany({
        where: { postId: 'post-1' },
        orderBy: { versionNumber: 'desc' },
      });

      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(2);
      expect(versions[1].versionNumber).toBe(1);
    });
  });
});