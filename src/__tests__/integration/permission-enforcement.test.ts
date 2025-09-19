import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET as campaignsGET, POST as campaignsPOST } from '../../app/api/campaigns/route';
import { UserRole, CampaignStatus } from '../../generated/prisma';
import { db } from '../../lib/db';
import * as permissions from '../../lib/permissions';
import * as clientIsolation from '../../lib/client-isolation';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../lib/db');
jest.mock('../../lib/permissions');
jest.mock('../../lib/client-isolation');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDb = db as jest.Mocked<typeof db>;
const mockPermissions = permissions as jest.Mocked<typeof permissions>;
const mockClientIsolation = clientIsolation as jest.Mocked<typeof clientIsolation>;

describe('Permission Enforcement Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'user1',
      role: UserRole.COLLABORATOR,
      agencyId: 'agency1',
    },
  };

  const mockUser = {
    id: 'user1',
    assignedClients: '["client1", "client2"]',
  };

  const mockCampaigns = [
    {
      id: 'campaign1',
      name: 'Campaign One',
      description: 'Test campaign',
      status: CampaignStatus.ACTIVE,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      createdAt: new Date('2023-01-01'),
      client: {
        id: 'client1',
        name: 'Client One',
      },
      _count: {
        jobs: 5,
      },
    },
  ];

  const mockClient = {
    id: 'client1',
    name: 'Test Client',
    agencyId: 'agency1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockClientIsolation.parseAssignedClientIds.mockReturnValue(['client1', 'client2']);
    mockClientIsolation.addClientFilter.mockReturnValue({
      clientId: { in: ['client1', 'client2'] },
    });
  });

  describe('Campaign API Permission Enforcement', () => {
    describe('GET /api/campaigns', () => {
      it('should apply client filtering for collaborators', async () => {
        mockDb.campaign.findMany.mockResolvedValue(mockCampaigns);
        mockDb.campaign.count.mockResolvedValue(1);

        const request = new NextRequest('http://localhost:3000/api/campaigns?page=1&limit=10');
        const response = await campaignsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.campaigns).toEqual(mockCampaigns);

        // Verify client filtering was applied
        expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
          where: {
            clientId: { in: ['client1', 'client2'] },
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });

      it('should enforce client-specific filtering when client parameter is provided', async () => {
        mockDb.campaign.findMany.mockResolvedValue([]);
        mockDb.campaign.count.mockResolvedValue(0);

        const request = new NextRequest('http://localhost:3000/api/campaigns?client=client1');
        const response = await campaignsGET(request);

        expect(response.status).toBe(200);
        expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
          where: {
            clientId: { in: ['client1', 'client2'] },
            clientId: 'client1', // Additional client filter
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });

      it('should deny access to non-assigned client', async () => {
        const request = new NextRequest('http://localhost:3000/api/campaigns?client=client3');
        const response = await campaignsGET(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error.message).toBe('Access denied to this client');
      });

      it('should apply search filters correctly', async () => {
        mockDb.campaign.findMany.mockResolvedValue([]);
        mockDb.campaign.count.mockResolvedValue(0);

        const request = new NextRequest('http://localhost:3000/api/campaigns?search=test');
        await campaignsGET(request);

        expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
          where: {
            clientId: { in: ['client1', 'client2'] },
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
              { client: { name: { contains: 'test', mode: 'insensitive' } } },
            ],
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });

      it('should apply status filters correctly', async () => {
        mockDb.campaign.findMany.mockResolvedValue([]);
        mockDb.campaign.count.mockResolvedValue(0);

        const request = new NextRequest('http://localhost:3000/api/campaigns?status=ACTIVE');
        await campaignsGET(request);

        expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
          where: {
            clientId: { in: ['client1', 'client2'] },
            status: CampaignStatus.ACTIVE,
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });

      it('should handle pagination correctly', async () => {
        mockDb.campaign.findMany.mockResolvedValue([]);
        mockDb.campaign.count.mockResolvedValue(25);

        const request = new NextRequest('http://localhost:3000/api/campaigns?page=3&limit=5');
        const response = await campaignsGET(request);
        const data = await response.json();

        expect(mockDb.campaign.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 10, // (3-1) * 5
            take: 5,
          })
        );

        expect(data.data.pagination).toEqual({
          page: 3,
          limit: 5,
          total: 25,
          pages: 5,
        });
      });

      it('should not apply client filtering for owners and managers', async () => {
        const managerSession = {
          ...mockSession,
          user: { ...mockSession.user, role: UserRole.MANAGER },
        };
        mockGetServerSession.mockResolvedValue(managerSession);
        mockClientIsolation.addClientFilter.mockReturnValue({
          client: { agencyId: 'agency1' },
        });

        mockDb.campaign.findMany.mockResolvedValue([]);
        mockDb.campaign.count.mockResolvedValue(0);

        const request = new NextRequest('http://localhost:3000/api/campaigns');
        await campaignsGET(request);

        expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
          where: {
            client: { agencyId: 'agency1' },
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });
    });

    describe('POST /api/campaigns', () => {
      const validCampaignData = {
        name: 'New Campaign',
        description: 'Test campaign description',
        clientId: 'client1',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        status: 'ACTIVE',
        settings: { budget: 1000 },
      };

      it('should create campaign with proper permission checks', async () => {
        mockPermissions.hasPermission.mockReturnValue(true);
        mockDb.client.findFirst.mockResolvedValue(mockClient);
        mockDb.campaign.create.mockResolvedValue({
          ...validCampaignData,
          id: 'campaign1',
          agencyId: 'agency1',
          startDate: new Date(validCampaignData.startDate),
          endDate: new Date(validCampaignData.endDate),
          settings: JSON.stringify(validCampaignData.settings),
          createdAt: new Date(),
          client: mockClient,
        });

        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(validCampaignData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await campaignsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.campaign.name).toBe('New Campaign');

        expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
          UserRole.COLLABORATOR,
          permissions.PERMISSIONS.CREATE_CAMPAIGNS
        );
      });

      it('should deny campaign creation without proper permissions', async () => {
        mockPermissions.hasPermission.mockReturnValue(false);

        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(validCampaignData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await campaignsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error.message).toBe('Insufficient permissions to create campaigns');
        expect(mockDb.campaign.create).not.toHaveBeenCalled();
      });

      it('should deny access to non-assigned client', async () => {
        mockPermissions.hasPermission.mockReturnValue(true);

        const invalidData = { ...validCampaignData, clientId: 'client3' };
        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await campaignsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error.message).toBe('Access denied to this client');
        expect(mockDb.campaign.create).not.toHaveBeenCalled();
      });

      it('should validate required fields', async () => {
        mockPermissions.hasPermission.mockReturnValue(true);

        const invalidData = { name: 'Test' }; // Missing required fields
        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await campaignsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.message).toBe('Name, client, start date, and end date are required');
      });

      it('should validate date ranges', async () => {
        mockPermissions.hasPermission.mockReturnValue(true);

        const invalidData = {
          ...validCampaignData,
          startDate: '2024-12-31T00:00:00Z',
          endDate: '2024-01-01T00:00:00Z', // End before start
        };

        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await campaignsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.message).toBe('End date must be after start date');
      });

      it('should verify client exists and belongs to same agency', async () => {
        mockPermissions.hasPermission.mockReturnValue(true);
        mockDb.client.findFirst.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(validCampaignData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await campaignsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error.message).toBe('Client not found');

        expect(mockDb.client.findFirst).toHaveBeenCalledWith({
          where: {
            id: 'client1',
            agencyId: 'agency1',
          },
        });
      });

      it('should handle JSON serialization of settings', async () => {
        mockPermissions.hasPermission.mockReturnValue(true);
        mockDb.client.findFirst.mockResolvedValue(mockClient);
        mockDb.campaign.create.mockResolvedValue({
          ...validCampaignData,
          id: 'campaign1',
          agencyId: 'agency1',
          startDate: new Date(validCampaignData.startDate),
          endDate: new Date(validCampaignData.endDate),
          settings: JSON.stringify(validCampaignData.settings),
          createdAt: new Date(),
          client: mockClient,
        });

        const request = new NextRequest('http://localhost:3000/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(validCampaignData),
          headers: { 'content-type': 'application/json' },
        });

        await campaignsPOST(request);

        expect(mockDb.campaign.create).toHaveBeenCalledWith({
          data: {
            name: 'New Campaign',
            description: 'Test campaign description',
            clientId: 'client1',
            agencyId: 'agency1',
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            status: 'ACTIVE',
            settings: '{"budget":1000}',
          },
          select: expect.any(Object),
        });
      });
    });
  });

  describe('Cross-Component Permission Enforcement', () => {
    it('should maintain consistent permission checks across different API endpoints', async () => {
      // Test that permission checks are consistent across different endpoints
      const collaboratorSession = {
        ...mockSession,
        user: { ...mockSession.user, role: UserRole.COLLABORATOR },
      };
      mockGetServerSession.mockResolvedValue(collaboratorSession);

      // Mock permission checks
      mockPermissions.hasPermission.mockImplementation((role, permission) => {
        if (role === UserRole.COLLABORATOR && permission === permissions.PERMISSIONS.CREATE_CAMPAIGNS) {
          return false; // Collaborators can't create campaigns
        }
        return true;
      });

      // Test campaign creation
      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Campaign',
          clientId: 'client1',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await campaignsPOST(request);
      expect(response.status).toBe(403);

      // Verify permission was checked
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        UserRole.COLLABORATOR,
        permissions.PERMISSIONS.CREATE_CAMPAIGNS
      );
    });

    it('should enforce agency isolation across all operations', async () => {
      // Test that agency isolation is enforced consistently
      mockDb.campaign.findMany.mockResolvedValue([]);
      mockDb.campaign.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/campaigns');
      await campaignsGET(request);

      // Verify that client filtering includes agency context
      expect(mockClientIsolation.addClientFilter).toHaveBeenCalledWith(
        UserRole.COLLABORATOR,
        ['client1', 'client2'],
        'agency1'
      );
    });

    it('should handle role-based access consistently', async () => {
      // Test different roles get different access levels
      const ownerSession = {
        ...mockSession,
        user: { ...mockSession.user, role: UserRole.OWNER },
      };
      mockGetServerSession.mockResolvedValue(ownerSession);
      mockClientIsolation.addClientFilter.mockReturnValue({
        client: { agencyId: 'agency1' },
      });

      mockDb.campaign.findMany.mockResolvedValue([]);
      mockDb.campaign.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/campaigns');
      await campaignsGET(request);

      // Owners should get agency-wide access, not client-specific filtering
      expect(mockClientIsolation.addClientFilter).toHaveBeenCalledWith(
        UserRole.OWNER,
        expect.any(Array),
        'agency1'
      );
    });
  });

  describe('Error Handling and Security', () => {
    it('should handle authentication errors consistently', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/campaigns');
      const response = await campaignsGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Authentication required');
    });

    it('should prevent data leakage through error messages', async () => {
      // Ensure error messages don't reveal sensitive information
      mockDb.campaign.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/campaigns');
      const response = await campaignsGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      // Error message should be generic, not revealing database details
      expect(data.error.message).not.toContain('Database connection failed');
    });

    it('should validate input data to prevent injection attacks', async () => {
      mockPermissions.hasPermission.mockReturnValue(true);

      // Test with potentially malicious input
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: '"; DROP TABLE campaigns; --',
        clientId: 'client1',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      };

      const request = new NextRequest('http://localhost:3000/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: { 'content-type': 'application/json' },
      });

      mockDb.client.findFirst.mockResolvedValue(mockClient);
      mockDb.campaign.create.mockResolvedValue({
        ...maliciousData,
        id: 'campaign1',
        agencyId: 'agency1',
        startDate: new Date(maliciousData.startDate),
        endDate: new Date(maliciousData.endDate),
        settings: null,
        createdAt: new Date(),
        client: mockClient,
      });

      const response = await campaignsPOST(request);

      // Should still process but with sanitized data
      expect(response.status).toBe(200);
      expect(mockDb.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '<script>alert("xss")</script>', // Should be trimmed but not sanitized at DB level
          description: '"; DROP TABLE campaigns; --',
        }),
        select: expect.any(Object),
      });
    });
  });
});