import { NextRequest } from 'next/server';
import { POST as generateContent } from '@/app/api/external/bot/generate/route';
import { GET as getJobStatus } from '@/app/api/external/bot/jobs/[jobId]/route';
import { GET as getClientInfo } from '@/app/api/external/bot/client/route';
import { ApiKeyService } from '@/lib/services/api-keys';
import { TokenConsumptionService } from '@/lib/services/token-consumption';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/services/api-keys');
jest.mock('@/lib/services/token-consumption');

describe('External Bot API Endpoints', () => {
  const validApiKey = 'pk_test123456789';
  const mockKeyData = {
    id: 'key-1',
    clientId: 'client-1',
    permissions: ['content:generate', 'content:read', 'client:read'],
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/external/bot/generate', () => {
    it('should create content generation job with valid API key', async () => {
      // Mock API key validation
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);
      (ApiKeyService.logUsage as jest.Mock).mockResolvedValue(undefined);

      // Mock token balance check
      (TokenConsumptionService.checkTokenBalance as jest.Mock).mockResolvedValue(true);
      (TokenConsumptionService.calculateJobTokens as jest.Mock).mockReturnValue(550);

      // Mock client data
      const mockClient = {
        id: 'client-1',
        brandName: 'Test Brand',
        brandColors: ['#FF0000'],
        description: 'Test brand',
        agency: {
          id: 'agency-1',
          tokenBalance: 1000,
          subscriptionPlan: 'INTERMEDIATE',
        },
        brandAssets: [],
        socialMediaLinks: [],
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      // Mock job creation
      const mockJob = {
        id: 'job-1',
        status: 'PENDING',
        tokensConsumed: 0,
        brandContext: {
          clientId: 'client-1',
          externalPrompt: 'Create a social media post',
        },
        createdAt: new Date(),
      };

      (db.contentGenerationJob.create as jest.Mock).mockResolvedValue(mockJob);

      const request = new NextRequest('http://localhost:3000/api/external/bot/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create a social media post about our new product',
          contentType: 'social_post',
          platforms: ['instagram', 'facebook'],
          includeImages: true,
          urgency: 'normal',
        }),
      });

      const response = await generateContent(request);
      const result = await response.json();

      expect(response.status).toBe(202);
      expect(result.success).toBe(true);
      expect(result.data.jobId).toBe('job-1');
      expect(result.data.status).toBe('accepted');
      expect(result.data.estimatedTokens).toBe(550);

      // Verify API key validation was called
      expect(ApiKeyService.validateApiKey).toHaveBeenCalledWith(validApiKey);
      expect(ApiKeyService.hasPermission).toHaveBeenCalledWith(mockKeyData, 'content:generate');

      // Verify usage logging
      expect(ApiKeyService.logUsage).toHaveBeenCalledWith(
        'key-1',
        '/api/external/bot/generate',
        'POST',
        202,
        0,
        undefined,
        undefined
      );
    });

    it('should reject request with invalid API key', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/external/bot/generate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid_key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
        }),
      });

      const response = await generateContent(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_API_KEY');
    });

    it('should reject request with insufficient permissions', async () => {
      const limitedKeyData = {
        ...mockKeyData,
        permissions: ['content:read'], // Missing content:generate
      };

      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(limitedKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/external/bot/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
        }),
      });

      const response = await generateContent(request);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should reject request with insufficient tokens', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);
      (TokenConsumptionService.checkTokenBalance as jest.Mock).mockResolvedValue(false);
      (TokenConsumptionService.calculateJobTokens as jest.Mock).mockReturnValue(550);

      const mockClient = {
        id: 'client-1',
        agency: { id: 'agency-1', tokenBalance: 100 },
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      const request = new NextRequest('http://localhost:3000/api/external/bot/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
        }),
      });

      const response = await generateContent(request);
      const result = await response.json();

      expect(response.status).toBe(402);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INSUFFICIENT_TOKENS');
      expect(result.error.details.required).toBe(550);
      expect(result.error.details.available).toBe(100);
    });

    it('should validate request parameters', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);

      // Test missing prompt
      const request = new NextRequest('http://localhost:3000/api/external/bot/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'social_post',
        }),
      });

      const response = await generateContent(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PROMPT');
    });

    it('should handle prompt length validation', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);

      const longPrompt = 'a'.repeat(2001); // Exceeds 2000 character limit

      const request = new NextRequest('http://localhost:3000/api/external/bot/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: longPrompt,
        }),
      });

      const response = await generateContent(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PROMPT_TOO_LONG');
    });
  });

  describe('GET /api/external/bot/jobs/[jobId]', () => {
    it('should return job status for valid job', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);
      (ApiKeyService.logUsage as jest.Mock).mockResolvedValue(undefined);

      const mockJob = {
        id: 'job-1',
        status: 'COMPLETED',
        tokensConsumed: 550,
        createdAt: new Date(),
        completedAt: new Date(),
        brandContext: { clientId: 'client-1' },
        steps: [
          {
            step: 'IDEA',
            status: 'COMPLETED',
            executedAt: new Date(),
            error: null,
          },
          {
            step: 'COPY_PUBLICATION',
            status: 'COMPLETED',
            executedAt: new Date(),
            error: null,
          },
        ],
        post: {
          id: 'post-1',
          finalImageUrl: 'https://example.com/image.jpg',
          embeddedText: 'Embedded text',
          publicationText: 'Publication text',
          hashtags: ['test', 'hashtag'],
          cta: 'Visit our website',
          status: 'DRAFT',
        },
      };

      (db.contentGenerationJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const request = new NextRequest('http://localhost:3000/api/external/bot/jobs/job-1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
        },
      });

      const response = await getJobStatus(request, { params: { jobId: 'job-1' } });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.jobId).toBe('job-1');
      expect(result.data.status).toBe('completed');
      expect(result.data.tokensConsumed).toBe(550);
      expect(result.data.progress.percentage).toBe(100);
      expect(result.data.content).toBeDefined();
      expect(result.data.content.publicationText).toBe('Publication text');
    });

    it('should return 404 for non-existent job', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);
      (db.contentGenerationJob.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/external/bot/jobs/nonexistent', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
        },
      });

      const response = await getJobStatus(request, { params: { jobId: 'nonexistent' } });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('JOB_NOT_FOUND');
    });

    it('should deny access to jobs from other clients', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);

      const mockJob = {
        id: 'job-1',
        brandContext: { clientId: 'other-client' }, // Different client
      };

      (db.contentGenerationJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const request = new NextRequest('http://localhost:3000/api/external/bot/jobs/job-1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
        },
      });

      const response = await getJobStatus(request, { params: { jobId: 'job-1' } });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('GET /api/external/bot/client', () => {
    it('should return client information', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);
      (ApiKeyService.logUsage as jest.Mock).mockResolvedValue(undefined);

      const mockClient = {
        id: 'client-1',
        brandName: 'Test Brand',
        description: 'Test brand description',
        brandColors: ['#FF0000', '#00FF00'],
        logoUrl: 'https://example.com/logo.png',
        whatsappNumber: '+1234567890',
        agency: {
          id: 'agency-1',
          name: 'Test Agency',
          tokenBalance: 1000,
          subscriptionPlan: 'INTERMEDIATE',
        },
        socialMediaLinks: [
          {
            platform: 'instagram',
            url: 'https://instagram.com/testbrand',
            username: 'testbrand',
          },
        ],
        socialAccounts: [
          {
            platform: 'INSTAGRAM',
            accountName: 'Test Brand',
            isActive: true,
          },
        ],
        campaigns: [
          {
            id: 'campaign-1',
            name: 'Summer Campaign',
            objective: 'Increase brand awareness',
            brandTone: 'Professional',
          },
        ],
      };

      // Mock statistics queries
      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (db.contentGenerationJob.aggregate as jest.Mock).mockResolvedValue({
        _count: 25,
        _sum: { tokensConsumed: 5000 },
      });
      (db.contentGenerationJob.count as jest.Mock).mockResolvedValue(20);

      const request = new NextRequest('http://localhost:3000/api/external/bot/client', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
        },
      });

      const response = await getClientInfo(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.client.brandName).toBe('Test Brand');
      expect(result.data.agency.name).toBe('Test Agency');
      expect(result.data.agency.tokenBalance).toBe(1000);
      expect(result.data.socialMedia.links).toHaveLength(1);
      expect(result.data.socialMedia.connectedAccounts).toHaveLength(1);
      expect(result.data.activeCampaigns).toHaveLength(1);
      expect(result.data.statistics.totalJobs).toBe(25);
      expect(result.data.statistics.completedJobs).toBe(20);
      expect(result.data.statistics.tokensConsumed).toBe(5000);
      expect(result.data.statistics.successRate).toBe(80); // 20/25 * 100
    });

    it('should require client:read permission', async () => {
      const limitedKeyData = {
        ...mockKeyData,
        permissions: ['content:generate'], // Missing client:read
      };

      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(limitedKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/external/bot/client', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
        },
      });

      const response = await getClientInfo(request);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Rate Limiting and Usage Tracking', () => {
    it('should log all API requests for usage tracking', async () => {
      (ApiKeyService.validateApiKey as jest.Mock).mockResolvedValue(mockKeyData);
      (ApiKeyService.hasPermission as jest.Mock).mockReturnValue(true);
      (ApiKeyService.logUsage as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/external/bot/client', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validApiKey}`,
          'User-Agent': 'WhatsApp-Bot/1.0',
        },
      });

      // Mock client data
      (db.client.findUnique as jest.Mock).mockResolvedValue({
        id: 'client-1',
        brandName: 'Test Brand',
        agency: { id: 'agency-1', name: 'Test Agency', tokenBalance: 1000, subscriptionPlan: 'BASIC' },
        socialMediaLinks: [],
        socialAccounts: [],
        campaigns: [],
      });

      (db.contentGenerationJob.aggregate as jest.Mock).mockResolvedValue({ _count: 0, _sum: { tokensConsumed: 0 } });
      (db.contentGenerationJob.count as jest.Mock).mockResolvedValue(0);

      const response = await getClientInfo(request);

      expect(ApiKeyService.logUsage).toHaveBeenCalledWith(
        'key-1',
        '/api/external/bot/client',
        'GET',
        200,
        0,
        undefined, // IP address
        'WhatsApp-Bot/1.0'
      );
    });
  });
});