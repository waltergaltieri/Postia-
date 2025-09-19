import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '../../generated/prisma';
import { db } from '../../lib/db';
import * as permissions from '../../lib/permissions';

// Import admin API handlers
import { GET as adminClientsGET, POST as adminClientsPOST } from '../../app/api/admin/clients/route';
import { GET as adminClientGET, PUT as adminClientPUT, DELETE as adminClientDELETE } from '../../app/api/admin/clients/[clientId]/route';
import { GET as adminMetricsGET } from '../../app/api/admin/dashboard/metrics/route';
import { GET as adminActivityGET } from '../../app/api/admin/dashboard/activity/route';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../lib/db');
jest.mock('../../lib/permissions');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDb = db as jest.Mocked<typeof db>;
const mockPermissions = permissions as jest.Mocked<typeof permissions>;

describe('Admin Dashboard Integration Tests', () => {
  const mockOwnerSession = {
    user: {
      id: 'owner1',
      role: UserRole.OWNER,
      agencyId: 'agency1',
    },
  };

  const mockManagerSession = {
    user: {
      id: 'manager1',
      role: UserRole.MANAGER,
      agencyId: 'agency1',
    },
  };

  const mockCollaboratorSession = {
    user: {
      id: 'collaborator1',
      role: UserRole.COLLABORATOR,
      agencyId: 'agency1',
    },
  };

  const mockClients = [
    {
      id: 'client1',
      name: 'Client One',
      agencyId: 'agency1',
      brandColors: '["#ff0000"]',
      logoUrl: 'https://example.com/logo1.png',
      themeSettings: '{"primaryColor": "#ff0000"}',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      _count: {
        campaigns: 3,
        contentJobs: 15,
      },
    },
    {
      id: 'client2',
      name: 'Client Two',
      agencyId: 'agency1',
      brandColors: null,
      logoUrl: null,
      themeSettings: null,
      isActive: false,
      createdAt: new Date('2023-01-02'),
      _count: {
        campaigns: 1,
        contentJobs: 5,
      },
    },
  ];

  const mockUsers = [
    {
      id: 'owner1',
      name: 'Owner User',
      email: 'owner@agency.com',
      role: UserRole.OWNER,
      agencyId: 'agency1',
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'manager1',
      name: 'Manager User',
      email: 'manager@agency.com',
      role: UserRole.MANAGER,
      agencyId: 'agency1',
      createdAt: new Date('2023-01-02'),
    },
    {
      id: 'collaborator1',
      name: 'Collaborator User',
      email: 'collaborator@agency.com',
      role: UserRole.COLLABORATOR,
      agencyId: 'agency1',
      createdAt: new Date('2023-01-03'),
    },
  ];

  const mockActivity = [
    {
      id: 'activity1',
      type: 'CLIENT_CREATED',
      description: 'Created client "Client One"',
      userId: 'owner1',
      agencyId: 'agency1',
      metadata: '{"clientId": "client1"}',
      createdAt: new Date('2023-12-01'),
      user: {
        name: 'Owner User',
        email: 'owner@agency.com',
      },
    },
    {
      id: 'activity2',
      type: 'CAMPAIGN_CREATED',
      description: 'Created campaign "Test Campaign"',
      userId: 'manager1',
      agencyId: 'agency1',
      metadata: '{"campaignId": "campaign1", "clientId": "client1"}',
      createdAt: new Date('2023-12-02'),
      user: {
        name: 'Manager User',
        email: 'manager@agency.com',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissions.hasPermission.mockReturnValue(true);
  });

  describe('Admin Client Management', () => {
    describe('GET /api/admin/clients', () => {
      it('should return paginated client list for owners', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findMany.mockResolvedValue(mockClients);
        mockDb.client.count.mockResolvedValue(2);

        const request = new NextRequest('http://localhost:3000/api/admin/clients?page=1&limit=10');
        const response = await adminClientsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.clients).toHaveLength(2);
        expect(data.data.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        });

        expect(mockDb.client.findMany).toHaveBeenCalledWith({
          where: { agencyId: 'agency1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            brandColors: true,
            logoUrl: true,
            themeSettings: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                campaigns: true,
                contentJobs: true,
              },
            },
          },
        });
      });

      it('should apply search filters correctly', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findMany.mockResolvedValue([mockClients[0]]);
        mockDb.client.count.mockResolvedValue(1);

        const request = new NextRequest('http://localhost:3000/api/admin/clients?search=Client One');
        const response = await adminClientsGET(request);

        expect(response.status).toBe(200);
        expect(mockDb.client.findMany).toHaveBeenCalledWith({
          where: {
            agencyId: 'agency1',
            name: { contains: 'Client One', mode: 'insensitive' },
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });

      it('should apply status filters correctly', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findMany.mockResolvedValue([mockClients[0]]);
        mockDb.client.count.mockResolvedValue(1);

        const request = new NextRequest('http://localhost:3000/api/admin/clients?status=active');
        const response = await adminClientsGET(request);

        expect(response.status).toBe(200);
        expect(mockDb.client.findMany).toHaveBeenCalledWith({
          where: {
            agencyId: 'agency1',
            isActive: true,
          },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        });
      });

      it('should deny access to collaborators', async () => {
        mockGetServerSession.mockResolvedValue(mockCollaboratorSession);
        mockPermissions.hasPermission.mockReturnValue(false);

        const request = new NextRequest('http://localhost:3000/api/admin/clients');
        const response = await adminClientsGET(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error.message).toBe('Insufficient permissions to manage clients');
        expect(mockDb.client.findMany).not.toHaveBeenCalled();
      });

      it('should handle pagination edge cases', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findMany.mockResolvedValue([]);
        mockDb.client.count.mockResolvedValue(0);

        const request = new NextRequest('http://localhost:3000/api/admin/clients?page=5&limit=10');
        const response = await adminClientsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.clients).toHaveLength(0);
        expect(data.data.pagination.pages).toBe(0);
      });
    });

    describe('POST /api/admin/clients', () => {
      const validClientData = {
        name: 'New Client',
        brandColors: ['#purple', '#gold'],
        logoUrl: 'https://example.com/new-logo.png',
        themeSettings: { primaryColor: '#purple', secondaryColor: '#gold' },
      };

      it('should create new client successfully', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.create.mockResolvedValue({
          id: 'client3',
          agencyId: 'agency1',
          isActive: true,
          createdAt: new Date(),
          ...validClientData,
          brandColors: JSON.stringify(validClientData.brandColors),
          themeSettings: JSON.stringify(validClientData.themeSettings),
        });

        const request = new NextRequest('http://localhost:3000/api/admin/clients', {
          method: 'POST',
          body: JSON.stringify(validClientData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await adminClientsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.client.name).toBe('New Client');
        expect(data.data.client.id).toBe('client3');

        expect(mockDb.client.create).toHaveBeenCalledWith({
          data: {
            name: 'New Client',
            agencyId: 'agency1',
            brandColors: '["#purple","#gold"]',
            logoUrl: 'https://example.com/new-logo.png',
            themeSettings: '{"primaryColor":"#purple","secondaryColor":"#gold"}',
            isActive: true,
          },
          select: expect.any(Object),
        });
      });

      it('should validate required fields', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);

        const invalidData = { brandColors: ['#red'] }; // Missing name
        const request = new NextRequest('http://localhost:3000/api/admin/clients', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await adminClientsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.message).toBe('Client name is required');
        expect(mockDb.client.create).not.toHaveBeenCalled();
      });

      it('should handle duplicate client names', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.create.mockRejectedValue({ code: 'P2002' }); // Prisma unique constraint error

        const request = new NextRequest('http://localhost:3000/api/admin/clients', {
          method: 'POST',
          body: JSON.stringify(validClientData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await adminClientsPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.message).toBe('A client with this name already exists');
      });

      it('should apply default values for optional fields', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.create.mockResolvedValue({
          id: 'client3',
          name: 'Minimal Client',
          agencyId: 'agency1',
          brandColors: '["#3b82f6"]',
          logoUrl: null,
          themeSettings: '{}',
          isActive: true,
          createdAt: new Date(),
        });

        const minimalData = { name: 'Minimal Client' };
        const request = new NextRequest('http://localhost:3000/api/admin/clients', {
          method: 'POST',
          body: JSON.stringify(minimalData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await adminClientsPOST(request);
        expect(response.status).toBe(200);

        expect(mockDb.client.create).toHaveBeenCalledWith({
          data: {
            name: 'Minimal Client',
            agencyId: 'agency1',
            brandColors: '["#3b82f6"]', // Default color
            logoUrl: null,
            themeSettings: '{}', // Default empty settings
            isActive: true,
          },
          select: expect.any(Object),
        });
      });
    });

    describe('Individual Client Management', () => {
      it('should get individual client details', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findFirst.mockResolvedValue(mockClients[0]);

        const request = new NextRequest('http://localhost:3000/api/admin/clients/client1');
        const response = await adminClientGET(request, { params: { clientId: 'client1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.client.id).toBe('client1');
        expect(data.data.client.name).toBe('Client One');

        expect(mockDb.client.findFirst).toHaveBeenCalledWith({
          where: {
            id: 'client1',
            agencyId: 'agency1',
          },
          select: expect.any(Object),
        });
      });

      it('should update client successfully', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
        mockDb.client.update.mockResolvedValue({
          ...mockClients[0],
          name: 'Updated Client Name',
        });

        const updateData = {
          name: 'Updated Client Name',
          brandColors: ['#newcolor'],
        };

        const request = new NextRequest('http://localhost:3000/api/admin/clients/client1', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'content-type': 'application/json' },
        });

        const response = await adminClientPUT(request, { params: { clientId: 'client1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.client.name).toBe('Updated Client Name');

        expect(mockDb.client.update).toHaveBeenCalledWith({
          where: { id: 'client1' },
          data: {
            name: 'Updated Client Name',
            brandColors: '["#newcolor"]',
          },
          select: expect.any(Object),
        });
      });

      it('should deactivate client instead of deleting', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
        mockDb.client.update.mockResolvedValue({
          ...mockClients[0],
          isActive: false,
        });

        const request = new NextRequest('http://localhost:3000/api/admin/clients/client1', {
          method: 'DELETE',
        });

        const response = await adminClientDELETE(request, { params: { clientId: 'client1' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('Client deactivated successfully');

        expect(mockDb.client.update).toHaveBeenCalledWith({
          where: { id: 'client1' },
          data: { isActive: false },
        });
      });

      it('should prevent access to clients from other agencies', async () => {
        mockGetServerSession.mockResolvedValue(mockOwnerSession);
        mockDb.client.findFirst.mockResolvedValue(null); // Client not found in agency

        const request = new NextRequest('http://localhost:3000/api/admin/clients/other-agency-client');
        const response = await adminClientGET(request, { params: { clientId: 'other-agency-client' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error.message).toBe('Client not found');

        expect(mockDb.client.findFirst).toHaveBeenCalledWith({
          where: {
            id: 'other-agency-client',
            agencyId: 'agency1', // Should only look in user's agency
          },
          select: expect.any(Object),
        });
      });
    });
  });

  describe('Admin Dashboard Metrics', () => {
    it('should return comprehensive agency metrics', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      
      // Mock metric queries
      mockDb.client.count.mockResolvedValue(5);
      mockDb.campaign.count.mockResolvedValue(12);
      mockDb.contentJob.count.mockResolvedValue(48);
      mockDb.user.count.mockResolvedValue(8);

      // Mock recent activity
      mockDb.client.findMany.mockResolvedValueOnce([
        { id: 'client1', name: 'Recent Client 1', createdAt: new Date('2023-12-01') },
        { id: 'client2', name: 'Recent Client 2', createdAt: new Date('2023-12-02') },
      ]);

      mockDb.campaign.findMany.mockResolvedValueOnce([
        { 
          id: 'campaign1', 
          name: 'Recent Campaign 1', 
          createdAt: new Date('2023-12-01'),
          client: { name: 'Client One' }
        },
      ]);

      mockDb.contentJob.findMany.mockResolvedValueOnce([
        {
          id: 'job1',
          type: 'SOCIAL_POST',
          createdAt: new Date('2023-12-01'),
          client: { name: 'Client One' }
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/metrics');
      const response = await adminMetricsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        totalClients: 5,
        totalCampaigns: 12,
        totalContentJobs: 48,
        totalUsers: 8,
        recentClients: expect.any(Array),
        recentCampaigns: expect.any(Array),
        recentContentJobs: expect.any(Array),
      });

      // Verify all counts are agency-scoped
      expect(mockDb.client.count).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
      });
      expect(mockDb.campaign.count).toHaveBeenCalledWith({
        where: { client: { agencyId: 'agency1' } },
      });
      expect(mockDb.contentJob.count).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
      });
      expect(mockDb.user.count).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
      });
    });

    it('should handle date range filtering for metrics', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.client.count.mockResolvedValue(3);
      mockDb.campaign.count.mockResolvedValue(8);
      mockDb.contentJob.count.mockResolvedValue(25);
      mockDb.user.count.mockResolvedValue(5);

      mockDb.client.findMany.mockResolvedValue([]);
      mockDb.campaign.findMany.mockResolvedValue([]);
      mockDb.contentJob.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/dashboard/metrics?startDate=2023-12-01&endDate=2023-12-31'
      );
      const response = await adminMetricsGET(request);

      expect(response.status).toBe(200);

      // Verify date filtering is applied to recent items
      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
          createdAt: {
            gte: new Date('2023-12-01T00:00:00.000Z'),
            lte: new Date('2023-12-31T23:59:59.999Z'),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: expect.any(Object),
      });
    });

    it('should deny access to non-admin users', async () => {
      mockGetServerSession.mockResolvedValue(mockCollaboratorSession);
      mockPermissions.hasPermission.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/metrics');
      const response = await adminMetricsGET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toBe('Insufficient permissions to view admin metrics');
    });
  });

  describe('Admin Activity Log', () => {
    it('should return paginated activity log', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.activityLog.findMany.mockResolvedValue(mockActivity);
      mockDb.activityLog.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/activity?page=1&limit=10');
      const response = await adminActivityGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.activities).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);

      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should filter activity by type', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.activityLog.findMany.mockResolvedValue([mockActivity[0]]);
      mockDb.activityLog.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/activity?type=CLIENT_CREATED');
      const response = await adminActivityGET(request);

      expect(response.status).toBe(200);
      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
          type: 'CLIENT_CREATED',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter activity by user', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.activityLog.findMany.mockResolvedValue([mockActivity[1]]);
      mockDb.activityLog.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/activity?userId=manager1');
      const response = await adminActivityGET(request);

      expect(response.status).toBe(200);
      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
          userId: 'manager1',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter activity by date range', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.activityLog.findMany.mockResolvedValue(mockActivity);
      mockDb.activityLog.count.mockResolvedValue(2);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/dashboard/activity?startDate=2023-12-01&endDate=2023-12-02'
      );
      const response = await adminActivityGET(request);

      expect(response.status).toBe(200);
      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
          createdAt: {
            gte: new Date('2023-12-01T00:00:00.000Z'),
            lte: new Date('2023-12-02T23:59:59.999Z'),
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should parse metadata correctly', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.activityLog.findMany.mockResolvedValue(mockActivity);
      mockDb.activityLog.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/activity');
      const response = await adminActivityGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.activities[0].metadata).toEqual({ clientId: 'client1' });
      expect(data.data.activities[1].metadata).toEqual({ 
        campaignId: 'campaign1', 
        clientId: 'client1' 
      });
    });

    it('should handle invalid metadata gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      const activityWithInvalidMetadata = [
        {
          ...mockActivity[0],
          metadata: 'invalid json',
        },
      ];
      mockDb.activityLog.findMany.mockResolvedValue(activityWithInvalidMetadata);
      mockDb.activityLog.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/activity');
      const response = await adminActivityGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.activities[0].metadata).toEqual({}); // Should default to empty object
    });
  });

  describe('Cross-Component Admin Integration', () => {
    it('should maintain consistent permissions across all admin endpoints', async () => {
      // Test that all admin endpoints check permissions consistently
      const endpoints = [
        { handler: adminClientsGET, url: 'http://localhost:3000/api/admin/clients' },
        { handler: adminMetricsGET, url: 'http://localhost:3000/api/admin/dashboard/metrics' },
        { handler: adminActivityGET, url: 'http://localhost:3000/api/admin/dashboard/activity' },
      ];

      mockGetServerSession.mockResolvedValue(mockCollaboratorSession);
      mockPermissions.hasPermission.mockReturnValue(false);

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url);
        const response = await endpoint.handler(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error.message).toContain('Insufficient permissions');
      }

      // Verify permission checks were called
      expect(mockPermissions.hasPermission).toHaveBeenCalledTimes(endpoints.length);
    });

    it('should maintain agency isolation across all admin operations', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);

      // Test client management
      mockDb.client.findMany.mockResolvedValue([]);
      mockDb.client.count.mockResolvedValue(0);
      
      const clientsRequest = new NextRequest('http://localhost:3000/api/admin/clients');
      await adminClientsGET(clientsRequest);

      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });

      // Test metrics
      mockDb.client.count.mockResolvedValue(0);
      mockDb.campaign.count.mockResolvedValue(0);
      mockDb.contentJob.count.mockResolvedValue(0);
      mockDb.user.count.mockResolvedValue(0);
      mockDb.client.findMany.mockResolvedValue([]);
      mockDb.campaign.findMany.mockResolvedValue([]);
      mockDb.contentJob.findMany.mockResolvedValue([]);

      const metricsRequest = new NextRequest('http://localhost:3000/api/admin/dashboard/metrics');
      await adminMetricsGET(metricsRequest);

      expect(mockDb.client.count).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
      });

      // Test activity log
      mockDb.activityLog.findMany.mockResolvedValue([]);
      mockDb.activityLog.count.mockResolvedValue(0);

      const activityRequest = new NextRequest('http://localhost:3000/api/admin/dashboard/activity');
      await adminActivityGET(activityRequest);

      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith({
        where: { agencyId: 'agency1' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should handle concurrent admin operations safely', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      
      // Simulate concurrent client creation
      const clientData = { name: 'Concurrent Client' };
      mockDb.client.create.mockResolvedValue({
        id: 'client-concurrent',
        name: 'Concurrent Client',
        agencyId: 'agency1',
        brandColors: '["#3b82f6"]',
        logoUrl: null,
        themeSettings: '{}',
        isActive: true,
        createdAt: new Date(),
      });

      const requests = Array.from({ length: 3 }, () =>
        new NextRequest('http://localhost:3000/api/admin/clients', {
          method: 'POST',
          body: JSON.stringify(clientData),
          headers: { 'content-type': 'application/json' },
        })
      );

      const responses = await Promise.all(
        requests.map(request => adminClientsPOST(request))
      );

      // All requests should be processed
      responses.forEach(response => {
        expect([200, 400]).toContain(response.status); // 200 for success, 400 for duplicate
      });

      expect(mockDb.client.create).toHaveBeenCalledTimes(3);
    });
  });
});