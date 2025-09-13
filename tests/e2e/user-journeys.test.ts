/**
 * End-to-End Tests for Critical User Journeys
 * 
 * These tests simulate complete user workflows from start to finish,
 * testing the integration of multiple components and services.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// Import API route handlers
import { POST as createClient } from '@/app/api/clients/route';
import { POST as createCampaign } from '@/app/api/campaigns/route';
import { POST as generateContent } from '@/app/api/content/generate/route';
import { POST as approvePost } from '@/app/api/posts/[postId]/approve/route';
import { POST as publishPost } from '@/app/api/posts/[postId]/publish/route';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('next-auth');
jest.mock('@/lib/services/openai');
jest.mock('@/lib/services/social-media');

const mockSession = {
  user: {
    id: 'user-1',
    agencyId: 'agency-1',
    role: 'OWNER',
    name: 'Test User',
    email: 'test@example.com',
  },
};

describe('End-to-End User Journeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('Complete Content Creation and Publishing Journey', () => {
    it('should complete the full workflow from client creation to content publishing', async () => {
      // Step 1: Create a new client
      const mockAgency = {
        id: 'agency-1',
        name: 'Test Agency',
        tokenBalance: 5000,
      };

      const mockClient = {
        id: 'client-1',
        brandName: 'Test Brand',
        brandColors: ['#FF0000', '#00FF00'],
        description: 'A test brand for e2e testing',
        agencyId: 'agency-1',
        createdAt: new Date(),
      };

      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);
      (db.client.create as jest.Mock).mockResolvedValue(mockClient);

      const createClientRequest = new NextRequest('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          brandName: 'Test Brand',
          brandColors: ['#FF0000', '#00FF00'],
          description: 'A test brand for e2e testing',
        }),
      });

      const clientResponse = await createClient(createClientRequest);
      const clientResult = await clientResponse.json();

      expect(clientResponse.status).toBe(201);
      expect(clientResult.success).toBe(true);
      expect(clientResult.data.client.brandName).toBe('Test Brand');

      // Step 2: Create a campaign for the client
      const mockCampaign = {
        id: 'campaign-1',
        clientId: 'client-1',
        name: 'Summer Campaign 2024',
        objective: 'Increase brand awareness',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        brandTone: 'Professional and friendly',
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      (db.client.findFirst as jest.Mock).mockResolvedValue(mockClient);
      (db.campaign.create as jest.Mock).mockResolvedValue(mockCampaign);

      const createCampaignRequest = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          name: 'Summer Campaign 2024',
          objective: 'Increase brand awareness',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          brandTone: 'Professional and friendly',
          publicationFrequency: { postsPerWeek: 3 },
        }),
      });

      const campaignResponse = await createCampaign(createCampaignRequest);
      const campaignResult = await campaignResponse.json();

      expect(campaignResponse.status).toBe(201);
      expect(campaignResult.success).toBe(true);
      expect(campaignResult.data.campaign.name).toBe('Summer Campaign 2024');

      // Step 3: Generate content for the campaign
      const mockJob = {
        id: 'job-1',
        status: 'COMPLETED',
        tokensConsumed: 550,
        brandContext: {
          clientId: 'client-1',
          brandName: 'Test Brand',
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };

      const mockPost = {
        id: 'post-1',
        campaignId: 'campaign-1',
        scheduledDate: new Date('2024-06-15'),
        status: 'DRAFT',
        finalImageUrl: 'https://example.com/generated-image.jpg',
        publicationText: 'Exciting summer collection now available! Check out our latest designs.',
        hashtags: ['summer', 'fashion', 'newcollection'],
        cta: 'Shop now at our website',
        generationJobId: 'job-1',
        createdAt: new Date(),
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue({
        ...mockClient,
        agency: mockAgency,
      });
      (db.contentGenerationJob.create as jest.Mock).mockResolvedValue(mockJob);
      (db.post.create as jest.Mock).mockResolvedValue(mockPost);

      const generateContentRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          campaignId: 'campaign-1',
          prompt: 'Create a social media post about our summer collection',
          contentType: 'social_post',
          platforms: ['instagram', 'facebook'],
          includeImages: true,
          brandTone: 'Professional and friendly',
          targetAudience: 'Fashion-conscious millennials',
        }),
      });

      const contentResponse = await generateContent(generateContentRequest);
      const contentResult = await contentResponse.json();

      expect(contentResponse.status).toBe(200);
      expect(contentResult.success).toBe(true);
      expect(contentResult.data.job.id).toBe('job-1');

      // Step 4: Approve the generated content
      (db.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (db.post.update as jest.Mock).mockResolvedValue({
        ...mockPost,
        status: 'APPROVED',
        approvedBy: mockSession.user.id,
        approvedAt: new Date(),
      });

      const approveRequest = new NextRequest('http://localhost:3000/api/posts/post-1/approve', {
        method: 'POST',
      });

      const approveResponse = await approvePost(approveRequest, { params: { postId: 'post-1' } });
      const approveResult = await approveResponse.json();

      expect(approveResponse.status).toBe(200);
      expect(approveResult.success).toBe(true);
      expect(approveResult.data.post.status).toBe('APPROVED');

      // Step 5: Publish the approved content
      const mockSocialAccounts = [
        {
          id: 'social-1',
          platform: 'INSTAGRAM',
          accountId: 'instagram_123',
          accountName: 'Test Brand',
          accessToken: 'mock_token',
          isActive: true,
        },
        {
          id: 'social-2',
          platform: 'FACEBOOK',
          accountId: 'facebook_456',
          accountName: 'Test Brand',
          accessToken: 'mock_token',
          isActive: true,
        },
      ];

      const mockPublicationResults = [
        {
          id: 'pub-1',
          postId: 'post-1',
          socialAccountId: 'social-1',
          platformPostId: 'ig_12345',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        {
          id: 'pub-2',
          postId: 'post-1',
          socialAccountId: 'social-2',
          platformPostId: 'fb_67890',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      ];

      (db.post.findUnique as jest.Mock).mockResolvedValue({
        ...mockPost,
        status: 'APPROVED',
        campaign: {
          client: {
            socialAccounts: mockSocialAccounts,
          },
        },
      });

      (db.publicationResult.createMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      (db.publicationResult.findMany as jest.Mock).mockResolvedValue(mockPublicationResults);

      (db.post.update as jest.Mock).mockResolvedValue({
        ...mockPost,
        status: 'PUBLISHED',
      });

      // Mock social media service
      const { SocialMediaService } = require('@/lib/services/social-media');
      jest.spyOn(SocialMediaService, 'publishToInstagram').mockResolvedValue({
        success: true,
        platformPostId: 'ig_12345',
      });
      jest.spyOn(SocialMediaService, 'publishToFacebook').mockResolvedValue({
        success: true,
        platformPostId: 'fb_67890',
      });

      const publishRequest = new NextRequest('http://localhost:3000/api/posts/post-1/publish', {
        method: 'POST',
        body: JSON.stringify({
          platforms: ['instagram', 'facebook'],
        }),
      });

      const publishResponse = await publishPost(publishRequest, { params: { postId: 'post-1' } });
      const publishResult = await publishResponse.json();

      expect(publishResponse.status).toBe(200);
      expect(publishResult.success).toBe(true);
      expect(publishResult.data.results).toHaveLength(2);
      expect(publishResult.data.results[0].status).toBe('PUBLISHED');
      expect(publishResult.data.results[1].status).toBe('PUBLISHED');

      // Verify the complete journey
      expect(db.client.create).toHaveBeenCalled();
      expect(db.campaign.create).toHaveBeenCalled();
      expect(db.contentGenerationJob.create).toHaveBeenCalled();
      expect(db.post.update).toHaveBeenCalledTimes(2); // Approve and publish
      expect(db.publicationResult.createMany).toHaveBeenCalled();
    });
  });

  describe('Multi-User Collaboration Journey', () => {
    it('should handle collaborative content creation and approval workflow', async () => {
      // Simulate different user roles in the workflow
      const ownerSession = {
        user: { id: 'owner-1', agencyId: 'agency-1', role: 'OWNER', name: 'Agency Owner' },
      };

      const managerSession = {
        user: { id: 'manager-1', agencyId: 'agency-1', role: 'MANAGER', name: 'Content Manager' },
      };

      const collaboratorSession = {
        user: { id: 'collab-1', agencyId: 'agency-1', role: 'COLLABORATOR', name: 'Content Creator' },
      };

      // Step 1: Collaborator creates content
      (getServerSession as jest.Mock).mockResolvedValue(collaboratorSession);

      const mockClient = {
        id: 'client-1',
        brandName: 'Collaborative Brand',
        agency: { id: 'agency-1', tokenBalance: 2000 },
      };

      const mockJob = {
        id: 'collab-job-1',
        status: 'COMPLETED',
        tokensConsumed: 300,
        createdAt: new Date(),
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (db.contentGenerationJob.create as jest.Mock).mockResolvedValue(mockJob);

      const generateRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create content for product launch',
          contentType: 'social_post',
        }),
      });

      const generateResponse = await generateContent(generateRequest);
      expect(generateResponse.status).toBe(200);

      // Step 2: Manager reviews and requests changes
      (getServerSession as jest.Mock).mockResolvedValue(managerSession);

      const mockPost = {
        id: 'collab-post-1',
        status: 'DRAFT',
        campaign: { client: { agencyId: 'agency-1' } },
      };

      (db.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      // Mock adding a comment (review feedback)
      const mockComment = {
        id: 'comment-1',
        postId: 'collab-post-1',
        content: 'Please adjust the tone to be more professional',
        authorId: 'manager-1',
        createdAt: new Date(),
      };

      (db.postComment.create as jest.Mock).mockResolvedValue(mockComment);

      // Step 3: Owner approves the content
      (getServerSession as jest.Mock).mockResolvedValue(ownerSession);

      (db.post.update as jest.Mock).mockResolvedValue({
        ...mockPost,
        status: 'APPROVED',
        approvedBy: 'owner-1',
        approvedAt: new Date(),
      });

      const approveRequest = new NextRequest('http://localhost:3000/api/posts/collab-post-1/approve', {
        method: 'POST',
      });

      const approveResponse = await approvePost(approveRequest, { params: { postId: 'collab-post-1' } });
      expect(approveResponse.status).toBe(200);

      // Verify role-based permissions were respected
      expect(db.contentGenerationJob.create).toHaveBeenCalled();
      expect(db.postComment.create).toHaveBeenCalled();
      expect(db.post.update).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Resilience Journey', () => {
    it('should handle and recover from various failure scenarios', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      // Scenario 1: Content generation fails, then succeeds on retry
      const mockClient = {
        id: 'client-1',
        brandName: 'Resilient Brand',
        agency: { id: 'agency-1', tokenBalance: 1000 },
      };

      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      // First attempt fails
      const failedJob = {
        id: 'failed-job-1',
        status: 'FAILED',
        tokensConsumed: 50,
        createdAt: new Date(),
      };

      (db.contentGenerationJob.create as jest.Mock)
        .mockResolvedValueOnce(failedJob)
        .mockResolvedValueOnce({
          id: 'retry-job-1',
          status: 'COMPLETED',
          tokensConsumed: 550,
          createdAt: new Date(),
        });

      // First generation attempt
      const firstAttempt = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create content that might fail',
        }),
      });

      const firstResponse = await generateContent(firstAttempt);
      expect(firstResponse.status).toBe(200);

      // Retry generation
      const retryAttempt = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create content that should succeed',
        }),
      });

      const retryResponse = await generateContent(retryAttempt);
      expect(retryResponse.status).toBe(200);

      // Scenario 2: Social media publishing fails for one platform, succeeds for another
      const mockPost = {
        id: 'resilient-post-1',
        status: 'APPROVED',
        campaign: {
          client: {
            socialAccounts: [
              {
                id: 'social-1',
                platform: 'INSTAGRAM',
                accountId: 'ig_123',
                accessToken: 'valid_token',
                isActive: true,
              },
              {
                id: 'social-2',
                platform: 'FACEBOOK',
                accountId: 'fb_456',
                accessToken: 'invalid_token', // This will fail
                isActive: true,
              },
            ],
          },
        },
      };

      (db.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      // Mock mixed success/failure in social publishing
      const { SocialMediaService } = require('@/lib/services/social-media');
      jest.spyOn(SocialMediaService, 'publishToInstagram').mockResolvedValue({
        success: true,
        platformPostId: 'ig_success_123',
      });
      jest.spyOn(SocialMediaService, 'publishToFacebook').mockRejectedValue(
        new Error('Invalid access token')
      );

      const mixedResults = [
        {
          id: 'pub-success-1',
          postId: 'resilient-post-1',
          socialAccountId: 'social-1',
          platformPostId: 'ig_success_123',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        {
          id: 'pub-failed-1',
          postId: 'resilient-post-1',
          socialAccountId: 'social-2',
          status: 'FAILED',
          error: 'Invalid access token',
        },
      ];

      (db.publicationResult.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (db.publicationResult.findMany as jest.Mock).mockResolvedValue(mixedResults);

      const publishRequest = new NextRequest('http://localhost:3000/api/posts/resilient-post-1/publish', {
        method: 'POST',
        body: JSON.stringify({
          platforms: ['instagram', 'facebook'],
        }),
      });

      const publishResponse = await publishPost(publishRequest, { params: { postId: 'resilient-post-1' } });
      const publishResult = await publishResponse.json();

      expect(publishResponse.status).toBe(200);
      expect(publishResult.success).toBe(true);
      expect(publishResult.data.results).toHaveLength(2);
      expect(publishResult.data.results[0].status).toBe('PUBLISHED');
      expect(publishResult.data.results[1].status).toBe('FAILED');

      // Verify partial success is handled gracefully
      expect(publishResult.data.summary.successful).toBe(1);
      expect(publishResult.data.summary.failed).toBe(1);
    });
  });

  describe('Token Management and Billing Journey', () => {
    it('should handle token consumption and billing throughout the workflow', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      // Start with limited tokens
      const mockAgency = {
        id: 'agency-1',
        tokenBalance: 100, // Low balance
        subscriptionPlan: 'BASIC',
      };

      const mockClient = {
        id: 'client-1',
        brandName: 'Budget Brand',
        agency: mockAgency,
      };

      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);
      (db.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      // Attempt content generation with insufficient tokens
      const generateRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create expensive content',
          includeImages: true, // This requires more tokens
        }),
      });

      const generateResponse = await generateContent(generateRequest);
      const generateResult = await generateResponse.json();

      // Should fail due to insufficient tokens
      expect(generateResponse.status).toBe(402);
      expect(generateResult.error.message).toContain('Insufficient token balance');

      // Simulate token purchase (this would be handled by Stripe webhook)
      const updatedAgency = {
        ...mockAgency,
        tokenBalance: 2000, // After purchase
      };

      (db.agency.findUnique as jest.Mock).mockResolvedValue(updatedAgency);
      (db.client.findUnique as jest.Mock).mockResolvedValue({
        ...mockClient,
        agency: updatedAgency,
      });

      // Mock token transaction creation
      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          agency: { update: jest.fn() },
          tokenTransaction: { create: jest.fn() },
        };
        return await callback(mockTx);
      });

      // Retry content generation with sufficient tokens
      const retryRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-1',
          prompt: 'Create content with sufficient tokens',
          includeImages: true,
        }),
      });

      const mockSuccessfulJob = {
        id: 'success-job-1',
        status: 'COMPLETED',
        tokensConsumed: 550,
        createdAt: new Date(),
      };

      (db.contentGenerationJob.create as jest.Mock).mockResolvedValue(mockSuccessfulJob);

      const retryResponse = await generateContent(retryRequest);
      const retryResult = await retryResponse.json();

      expect(retryResponse.status).toBe(200);
      expect(retryResult.success).toBe(true);
      expect(retryResult.data.job.id).toBe('success-job-1');

      // Verify token consumption was tracked
      expect(db.$transaction).toHaveBeenCalled();
    });
  });
});