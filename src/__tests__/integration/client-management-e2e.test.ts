import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole, CampaignStatus } from '../../generated/prisma';
import { db } from '../../lib/db';
import * as clientIsolation from '../../lib/client-isolation';
import * as permissions from '../../lib/permissions';

// Import API handlers
import { POST as switchClientPOST, GET as switchClientGET } from '../../app/api/clients/switch/route';
import { GET as campaignsGET, POST as campaignsPOST } from '../../app/api/campaigns/route';
import { POST as contentGeneratePOST } from '../../app/api/content/generate/route';
import { GET as adminClientsGET, POST as adminClientsPOST } from '../../app/api/admin/clients/route';
import { GET as adminMetricsGET } from '../../app/api/admin/dashboard/metrics/route';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../lib/db');
jest.mock('../../lib/client-isolation');
jest.mock('../../lib/permissions');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDb = db as jest.Mocked<typeof db>;
const mockClientIsolation = clientIsolation as jest.Mocked<typeof clientIsolation>;
const mockPermissions = permissions as jest.Mocked<typeof permissions>;

describe('Client Management End-to-End Integration Tests', () => {
  // Test data setup
  const mockAgency = {
    id: 'agency1',
    name: 'Test Agency',
  };

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
      brandColors: '["#ff0000", "#00ff00"]',
      logoUrl: 'https://example.com/logo1.png',
      themeSettings: '{"primaryColor": "#ff0000"}',
      isActive: true,
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'client2',
      name: 'Client Two',
      agencyId: 'agency1',
      brandColors: '["#0000ff"]',
      logoUrl: 'https://example.com/logo2.png',
      themeSettings: '{"primaryColor": "#0000ff"}',
      isActive: true,
      createdAt: new Date('2023-01-02'),
    },
  ];

  const mockUsers = {
    owner1: {
      id: 'owner1',
      lastSelectedClient: 'client1',
      assignedClients: '["client1", "client2"]',
    },
    manager1: {
      id: 'manager1',
      lastSelectedClient: 'client2',
      assignedClients: '["client1", "client2"]',
    },
    collaborator1: {
      id: 'collaborator1',
      lastSelectedClient: 'client1',
      assignedClients: '["client1"]', // Only has access to client1
    },
  };

  const mockCampaigns = [
    {
      id: 'campaign1',
      name: 'Campaign One',
      description: 'Test campaign for client 1',
      status: CampaignStatus.ACTIVE,
      clientId: 'client1',
      agencyId: 'agency1',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      createdAt: new Date('2023-01-01'),
      client: mockClients[0],
      _count: { jobs: 5 },
    },
    {
      id: 'campaign2',
      name: 'Campaign Two',
      description: 'Test campaign for client 2',
      status: CampaignStatus.ACTIVE,
      clientId: 'client2',
      agencyId: 'agency1',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      createdAt: new Date('2023-01-02'),
      client: mockClients[1],
      _count: { jobs: 3 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockClientIsolation.parseAssignedClientIds.mockImplementation((assignedClients) => {
      try {
        return JSON.parse(assignedClients || '[]');
      } catch {
        return [];
      }
    });
    
    mockClientIsolation.validateClientAccess.mockResolvedValue(true);
    mockClientIsolation.addClientFilter.mockImplementation((role, assignedClientIds, agencyId) => {
      if (role === UserRole.COLLABORATOR) {
        return { clientId: { in: assignedClientIds } };
      }
      return { client: { agencyId } };
    });

    mockPermissions.hasPermission.mockReturnValue(true);
  });

  describe('Complete Client Switching Workflow', () => {
    it('should handle complete client switching workflow for manager', async () => {
      // Setup: Manager session
      mockGetServerSession.mockResolvedValue(mockManagerSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager1);
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.clientSession.findMany.mockResolvedValue([]);

      // Step 1: Get available clients
      const getClientsRequest = new NextRequest('http://localhost:3000/api/clients/switch');
      const getClientsResponse = await switchClientGET(getClientsRequest);
      const clientsData = await getClientsResponse.json();

      expect(getClientsResponse.status).toBe(200);
      expect(clientsData.data.accessibleClients).toHaveLength(2);
      expect(clientsData.data.currentClientId).toBe('client2');

      // Step 2: Switch to client1
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      mockDb.user.update.mockResolvedValue({ ...mockUsers.manager1, lastSelectedClient: 'client1' });
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'manager1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const switchRequest = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const switchResponse = await switchClientPOST(switchRequest);
      const switchData = await switchResponse.json();

      expect(switchResponse.status).toBe(200);
      expect(switchData.data.client.id).toBe('client1');
      expect(switchData.data.client.name).toBe('Client One');

      // Step 3: Verify data isolation - get campaigns for client1
      mockDb.campaign.findMany.mockResolvedValue([mockCampaigns[0]]);
      mockDb.campaign.count.mockResolvedValue(1);

      const campaignsRequest = new NextRequest('http://localhost:3000/api/campaigns?client=client1');
      const campaignsResponse = await campaignsGET(campaignsRequest);
      const campaignsData = await campaignsResponse.json();

      expect(campaignsResponse.status).toBe(200);
      expect(campaignsData.data.campaigns).toHaveLength(1);
      expect(campaignsData.data.campaigns[0].clientId).toBe('client1');

      // Verify session persistence was updated
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'manager1' },
        data: { lastSelectedClient: 'client1' },
      });

      expect(mockDb.clientSession.upsert).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'manager1',
            clientId: 'client1',
          },
        },
        update: {
          lastAccessed: expect.any(Date),
          sessionData: '{}',
        },
        create: {
          userId: 'manager1',
          clientId: 'client1',
          lastAccessed: expect.any(Date),
          sessionData: '{}',
        },
      });
    });

    it('should enforce client access restrictions for collaborators', async () => {
      // Setup: Collaborator session with limited access
      mockGetServerSession.mockResolvedValue(mockCollaboratorSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.collaborator1);

      // Step 1: Try to switch to client2 (not assigned)
      mockClientIsolation.validateClientAccess.mockResolvedValue(false);

      const switchRequest = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client2' }),
        headers: { 'content-type': 'application/json' },
      });

      const switchResponse = await switchClientPOST(switchRequest);
      const switchData = await switchResponse.json();

      expect(switchResponse.status).toBe(403);
      expect(switchData.error.message).toBe('Access denied to this client');

      // Step 2: Switch to client1 (assigned)
      mockClientIsolation.validateClientAccess.mockResolvedValue(true);
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      mockDb.user.update.mockResolvedValue({ ...mockUsers.collaborator1, lastSelectedClient: 'client1' });
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session2',
        userId: 'collaborator1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const validSwitchRequest = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const validSwitchResponse = await switchClientPOST(validSwitchRequest);
      expect(validSwitchResponse.status).toBe(200);

      // Step 3: Verify filtered data access
      mockDb.campaign.findMany.mockResolvedValue([mockCampaigns[0]]);
      mockDb.campaign.count.mockResolvedValue(1);

      const campaignsRequest = new NextRequest('http://localhost:3000/api/campaigns');
      const campaignsResponse = await campaignsGET(campaignsRequest);
      const campaignsData = await campaignsResponse.json();

      expect(campaignsResponse.status).toBe(200);
      expect(campaignsData.data.campaigns).toHaveLength(1);
      expect(campaignsData.data.campaigns[0].clientId).toBe('client1');

      // Verify client filtering was applied
      expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
        where: {
          clientId: { in: ['client1'] }, // Only client1 accessible
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });
  });

  describe('Admin Dashboard Functionality', () => {
    it('should provide admin dashboard access for owners', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.owner1);

      // Step 1: Get admin client list
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.client.count.mockResolvedValue(2);

      const adminClientsRequest = new NextRequest('http://localhost:3000/api/admin/clients');
      const adminClientsResponse = await adminClientsGET(adminClientsRequest);
      const adminClientsData = await adminClientsResponse.json();

      expect(adminClientsResponse.status).toBe(200);
      expect(adminClientsData.data.clients).toHaveLength(2);
      expect(adminClientsData.data.pagination.total).toBe(2);

      // Step 2: Get admin metrics
      mockDb.client.count.mockResolvedValue(2);
      mockDb.campaign.count.mockResolvedValue(2);
      mockDb.contentJob.count.mockResolvedValue(8);
      mockDb.user.count.mockResolvedValue(3);

      const metricsRequest = new NextRequest('http://localhost:3000/api/admin/dashboard/metrics');
      const metricsResponse = await adminMetricsGET(metricsRequest);
      const metricsData = await metricsResponse.json();

      expect(metricsResponse.status).toBe(200);
      expect(metricsData.data.totalClients).toBe(2);
      expect(metricsData.data.totalCampaigns).toBe(2);
      expect(metricsData.data.totalContentJobs).toBe(8);
      expect(metricsData.data.totalUsers).toBe(3);

      // Step 3: Create new client
      const newClientData = {
        name: 'New Client',
        brandColors: ['#purple'],
        logoUrl: 'https://example.com/new-logo.png',
        themeSettings: { primaryColor: '#purple' },
      };

      mockDb.client.create.mockResolvedValue({
        id: 'client3',
        agencyId: 'agency1',
        isActive: true,
        createdAt: new Date(),
        ...newClientData,
        brandColors: JSON.stringify(newClientData.brandColors),
        themeSettings: JSON.stringify(newClientData.themeSettings),
      });

      const createClientRequest = new NextRequest('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        body: JSON.stringify(newClientData),
        headers: { 'content-type': 'application/json' },
      });

      const createClientResponse = await adminClientsPOST(createClientRequest);
      const createClientData = await createClientResponse.json();

      expect(createClientResponse.status).toBe(200);
      expect(createClientData.data.client.name).toBe('New Client');
      expect(createClientData.data.client.id).toBe('client3');
    });

    it('should deny admin access to collaborators', async () => {
      mockGetServerSession.mockResolvedValue(mockCollaboratorSession);
      mockPermissions.hasPermission.mockReturnValue(false);

      const adminClientsRequest = new NextRequest('http://localhost:3000/api/admin/clients');
      const adminClientsResponse = await adminClientsGET(adminClientsRequest);
      const adminClientsData = await adminClientsResponse.json();

      expect(adminClientsResponse.status).toBe(403);
      expect(adminClientsData.error.message).toBe('Insufficient permissions to manage clients');
    });
  });

  describe('Data Isolation Verification', () => {
    it('should maintain complete data isolation across all components', async () => {
      // Test with collaborator who only has access to client1
      mockGetServerSession.mockResolvedValue(mockCollaboratorSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.collaborator1);

      // Test 1: Campaign access
      mockDb.campaign.findMany.mockResolvedValue([mockCampaigns[0]]);
      mockDb.campaign.count.mockResolvedValue(1);

      const campaignsRequest = new NextRequest('http://localhost:3000/api/campaigns');
      const campaignsResponse = await campaignsGET(campaignsRequest);
      const campaignsData = await campaignsResponse.json();

      expect(campaignsResponse.status).toBe(200);
      expect(campaignsData.data.campaigns).toHaveLength(1);
      expect(campaignsData.data.campaigns[0].clientId).toBe('client1');

      // Verify filtering was applied
      expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
        where: {
          clientId: { in: ['client1'] },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });

      // Test 2: Try to access client2 data directly
      const client2CampaignsRequest = new NextRequest('http://localhost:3000/api/campaigns?client=client2');
      const client2CampaignsResponse = await campaignsGET(client2CampaignsRequest);
      const client2CampaignsData = await client2CampaignsResponse.json();

      expect(client2CampaignsResponse.status).toBe(403);
      expect(client2CampaignsData.error.message).toBe('Access denied to this client');

      // Test 3: Content generation should be isolated
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      mockDb.contentJob.create.mockResolvedValue({
        id: 'job1',
        clientId: 'client1',
        agencyId: 'agency1',
        type: 'SOCIAL_POST',
        status: 'PENDING',
        prompt: 'Test prompt',
        createdAt: new Date(),
        client: mockClients[0],
      });

      const contentRequest = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client1',
          type: 'SOCIAL_POST',
          prompt: 'Test prompt',
        }),
        headers: { 'content-type': 'application/json' },
      });

      const contentResponse = await contentGeneratePOST(contentRequest);
      expect(contentResponse.status).toBe(200);

      // Verify client validation was performed
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client1',
          agencyId: 'agency1',
        },
      });
    });

    it('should prevent cross-agency data access', async () => {
      // Setup user from different agency
      const otherAgencySession = {
        user: {
          id: 'user2',
          role: UserRole.MANAGER,
          agencyId: 'agency2',
        },
      };

      mockGetServerSession.mockResolvedValue(otherAgencySession);
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user2',
        assignedClients: '["client1"]', // Same client ID but different agency
      });

      // Try to switch to client1 from different agency
      mockDb.client.findFirst.mockResolvedValue(null); // Client not found in agency2

      const switchRequest = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const switchResponse = await switchClientPOST(switchRequest);
      const switchData = await switchResponse.json();

      expect(switchResponse.status).toBe(404);
      expect(switchData.error.message).toBe('Client not found or inactive');

      // Verify agency isolation in query
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client1',
          agencyId: 'agency2', // Should only look in user's agency
          isActive: true,
        },
        select: expect.any(Object),
      });
    });
  });

  describe('Session Persistence and Recovery', () => {
    it('should restore last selected client on session recovery', async () => {
      mockGetServerSession.mockResolvedValue(mockManagerSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager1);
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.clientSession.findMany.mockResolvedValue([
        {
          id: 'session1',
          userId: 'manager1',
          clientId: 'client2',
          lastAccessed: new Date('2023-12-01'),
          sessionData: '{}',
          client: {
            id: 'client2',
            name: 'Client Two',
            brandColors: '["#0000ff"]',
            logoUrl: 'https://example.com/logo2.png',
          },
        },
      ]);

      const getClientsRequest = new NextRequest('http://localhost:3000/api/clients/switch');
      const getClientsResponse = await switchClientGET(getClientsRequest);
      const clientsData = await getClientsResponse.json();

      expect(getClientsResponse.status).toBe(200);
      expect(clientsData.data.currentClientId).toBe('client2'); // Last selected client
      expect(clientsData.data.recentSessions).toHaveLength(1);
      expect(clientsData.data.recentSessions[0].clientId).toBe('client2');
    });

    it('should handle session data corruption gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockManagerSession);
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUsers.manager1,
        assignedClients: 'invalid json', // Corrupted data
      });
      mockClientIsolation.parseAssignedClientIds.mockReturnValue([]); // Fallback to empty array

      mockDb.client.findMany.mockResolvedValue([]);
      mockDb.clientSession.findMany.mockResolvedValue([]);

      const getClientsRequest = new NextRequest('http://localhost:3000/api/clients/switch');
      const getClientsResponse = await switchClientGET(getClientsRequest);
      const clientsData = await getClientsResponse.json();

      expect(getClientsResponse.status).toBe(200);
      expect(clientsData.data.accessibleClients).toHaveLength(0);
      expect(clientsData.data.currentClientId).toBeNull();
    });
  });

  describe('Performance and Caching', () => {
    it('should handle multiple concurrent client switches efficiently', async () => {
      mockGetServerSession.mockResolvedValue(mockManagerSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager1);
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      mockDb.user.update.mockResolvedValue({ ...mockUsers.manager1, lastSelectedClient: 'client1' });
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'manager1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      // Simulate multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        new NextRequest('http://localhost:3000/api/clients/switch', {
          method: 'POST',
          body: JSON.stringify({ clientId: 'client1' }),
          headers: { 'content-type': 'application/json' },
        })
      );

      const responses = await Promise.all(
        requests.map(request => switchClientPOST(request))
      );

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Database operations should have been called for each request
      expect(mockDb.clientSession.upsert).toHaveBeenCalledTimes(5);
    });

    it('should optimize database queries for large client lists', async () => {
      mockGetServerSession.mockResolvedValue(mockOwnerSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.owner1);

      // Simulate large number of clients
      const manyClients = Array.from({ length: 100 }, (_, i) => ({
        id: `client${i + 1}`,
        name: `Client ${i + 1}`,
        agencyId: 'agency1',
        brandColors: '["#000000"]',
        logoUrl: null,
        themeSettings: null,
        isActive: true,
        createdAt: new Date(),
      }));

      mockDb.client.findMany.mockResolvedValue(manyClients);
      mockDb.clientSession.findMany.mockResolvedValue([]);

      const getClientsRequest = new NextRequest('http://localhost:3000/api/clients/switch');
      const getClientsResponse = await switchClientGET(getClientsRequest);
      const clientsData = await getClientsResponse.json();

      expect(getClientsResponse.status).toBe(200);
      expect(clientsData.data.accessibleClients).toHaveLength(100);

      // Verify efficient query structure
      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: expect.any(Array) },
          agencyId: 'agency1',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          brandColors: true,
          logoUrl: true,
          themeSettings: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      // Recent sessions should be limited
      expect(mockDb.clientSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'owner1',
          clientId: { in: expect.any(Array) },
        },
        orderBy: { lastAccessed: 'desc' },
        take: 5, // Limited to 5 recent sessions
        include: {
          client: {
            select: {
              id: true,
              name: true,
              brandColors: true,
              logoUrl: true,
            },
          },
        },
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockManagerSession);
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const switchRequest = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const switchResponse = await switchClientPOST(switchRequest);
      const switchData = await switchResponse.json();

      expect(switchResponse.status).toBe(500);
      expect(switchData.error.message).toBe('Failed to switch client');
      // Should not expose internal error details
      expect(switchData.error.message).not.toContain('Database connection failed');
    });

    it('should recover from partial failures in client switching', async () => {
      mockGetServerSession.mockResolvedValue(mockManagerSession);
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager1);
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      
      // User update succeeds but session upsert fails
      mockDb.user.update.mockResolvedValue({ ...mockUsers.manager1, lastSelectedClient: 'client1' });
      mockDb.clientSession.upsert.mockRejectedValue(new Error('Session update failed'));

      const switchRequest = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const switchResponse = await switchClientPOST(switchRequest);
      const switchData = await switchResponse.json();

      // Should still succeed even if session tracking fails
      expect(switchResponse.status).toBe(200);
      expect(switchData.data.client.id).toBe('client1');
      
      // User preference should still be updated
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'manager1' },
        data: { lastSelectedClient: 'client1' },
      });
    });
  });
});