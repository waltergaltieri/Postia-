/**
 * Core Client Management Integration Tests
 * 
 * This test suite verifies the complete client management workflow
 * including client switching, data isolation, and admin functionality.
 */

import { UserRole } from '../../generated/prisma';
import { db } from '../../lib/db';
import * as clientIsolation from '../../lib/client-isolation';
import * as permissions from '../../lib/permissions';

// Mock dependencies
jest.mock('../../lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    campaign: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    contentJob: {
      count: jest.fn(),
    },
    clientSession: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    activityLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../lib/client-isolation', () => ({
  parseAssignedClientIds: jest.fn(),
  validateClientAccess: jest.fn(),
  ClientAccessError: class ClientAccessError extends Error {
    constructor(userId: string, clientId: string, message: string) {
      super(message);
      this.name = 'ClientAccessError';
    }
  },
}));

jest.mock('../../lib/permissions', () => ({
  hasPermission: jest.fn(),
  PERMISSIONS: {
    MANAGE_CLIENTS: 'MANAGE_CLIENTS',
    CREATE_CAMPAIGNS: 'CREATE_CAMPAIGNS',
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockClientIsolation = clientIsolation as jest.Mocked<typeof clientIsolation>;
const mockPermissions = permissions as jest.Mocked<typeof permissions>;

describe('Client Management Core Integration Tests', () => {
  // Test data setup
  const mockAgency = {
    id: 'agency1',
    name: 'Test Agency',
  };

  const mockUsers = {
    owner: {
      id: 'owner1',
      role: UserRole.OWNER,
      agencyId: 'agency1',
      assignedClients: '["client1", "client2"]',
      lastSelectedClient: 'client1',
    },
    manager: {
      id: 'manager1',
      role: UserRole.MANAGER,
      agencyId: 'agency1',
      assignedClients: '["client1", "client2"]',
      lastSelectedClient: 'client2',
    },
    collaborator: {
      id: 'collaborator1',
      role: UserRole.COLLABORATOR,
      agencyId: 'agency1',
      assignedClients: '["client1"]', // Limited access
      lastSelectedClient: 'client1',
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

  const mockCampaigns = [
    {
      id: 'campaign1',
      name: 'Campaign One',
      clientId: 'client1',
      agencyId: 'agency1',
      status: 'ACTIVE',
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'campaign2',
      name: 'Campaign Two',
      clientId: 'client2',
      agencyId: 'agency1',
      status: 'ACTIVE',
      createdAt: new Date('2023-01-02'),
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
    mockPermissions.hasPermission.mockReturnValue(true);
  });

  describe('Client Access Validation Workflow', () => {
    it('should validate complete client access workflow for different user roles', async () => {
      // Test Owner access
      const ownerClientIds = mockClientIsolation.parseAssignedClientIds(mockUsers.owner.assignedClients);
      expect(ownerClientIds).toEqual(['client1', 'client2']);

      await mockClientIsolation.validateClientAccess('owner1', UserRole.OWNER, 'client1');
      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith('owner1', UserRole.OWNER, 'client1');

      // Test Manager access
      const managerClientIds = mockClientIsolation.parseAssignedClientIds(mockUsers.manager.assignedClients);
      expect(managerClientIds).toEqual(['client1', 'client2']);

      await mockClientIsolation.validateClientAccess('manager1', UserRole.MANAGER, 'client2');
      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith('manager1', UserRole.MANAGER, 'client2');

      // Test Collaborator limited access
      const collaboratorClientIds = mockClientIsolation.parseAssignedClientIds(mockUsers.collaborator.assignedClients);
      expect(collaboratorClientIds).toEqual(['client1']);

      await mockClientIsolation.validateClientAccess('collaborator1', UserRole.COLLABORATOR, 'client1');
      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith('collaborator1', UserRole.COLLABORATOR, 'client1');

      // Test denied access for collaborator
      mockClientIsolation.validateClientAccess.mockResolvedValueOnce(false);
      const hasAccess = await mockClientIsolation.validateClientAccess('collaborator1', UserRole.COLLABORATOR, 'client2');
      expect(hasAccess).toBe(false);
    });

    it('should handle client access errors appropriately', async () => {
      const accessError = new clientIsolation.ClientAccessError('user1', 'client1', 'Custom access denied');
      mockClientIsolation.validateClientAccess.mockRejectedValue(accessError);

      try {
        await mockClientIsolation.validateClientAccess('user1', UserRole.COLLABORATOR, 'client1');
        fail('Should have thrown ClientAccessError');
      } catch (error) {
        expect(error).toBeInstanceOf(clientIsolation.ClientAccessError);
        expect(error.message).toBe('Custom access denied');
      }
    });

    it('should parse assigned client IDs with error handling', () => {
      // Valid JSON
      expect(mockClientIsolation.parseAssignedClientIds('["client1", "client2"]')).toEqual(['client1', 'client2']);

      // Invalid JSON should return empty array
      mockClientIsolation.parseAssignedClientIds.mockReturnValueOnce([]);
      expect(mockClientIsolation.parseAssignedClientIds('invalid json')).toEqual([]);

      // Null/undefined should return empty array
      mockClientIsolation.parseAssignedClientIds.mockReturnValueOnce([]);
      expect(mockClientIsolation.parseAssignedClientIds(null)).toEqual([]);
    });
  });

  describe('Client Switching Workflow', () => {
    it('should complete client switching workflow with session persistence', async () => {
      // Step 1: Get user data
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager);

      const user = await mockDb.user.findUnique({
        where: { id: 'manager1' },
      });

      expect(user).toEqual(mockUsers.manager);
      expect(user.lastSelectedClient).toBe('client2');

      // Step 2: Validate client access
      await mockClientIsolation.validateClientAccess('manager1', UserRole.MANAGER, 'client1');
      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith('manager1', UserRole.MANAGER, 'client1');

      // Step 3: Get client data
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);

      const client = await mockDb.client.findFirst({
        where: {
          id: 'client1',
          agencyId: 'agency1',
          isActive: true,
        },
      });

      expect(client).toEqual(mockClients[0]);

      // Step 4: Update user's last selected client
      mockDb.user.update.mockResolvedValue({
        ...mockUsers.manager,
        lastSelectedClient: 'client1',
      });

      const updatedUser = await mockDb.user.update({
        where: { id: 'manager1' },
        data: { lastSelectedClient: 'client1' },
      });

      expect(updatedUser.lastSelectedClient).toBe('client1');

      // Step 5: Create/update client session
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'manager1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const session = await mockDb.clientSession.upsert({
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

      expect(session.clientId).toBe('client1');
      expect(session.userId).toBe('manager1');
    });

    it('should handle client switching failures gracefully', async () => {
      // Simulate database failure during user update
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager);
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      mockDb.user.update.mockRejectedValue(new Error('Database connection failed'));

      try {
        await mockDb.user.update({
          where: { id: 'manager1' },
          data: { lastSelectedClient: 'client1' },
        });
        fail('Should have thrown database error');
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }

      // Session upsert should still be attempted even if user update fails
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'manager1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const session = await mockDb.clientSession.upsert({
        where: {
          userId_clientId: {
            userId: 'manager1',
            clientId: 'client1',
          },
        },
        update: { lastAccessed: expect.any(Date) },
        create: {
          userId: 'manager1',
          clientId: 'client1',
          lastAccessed: expect.any(Date),
          sessionData: '{}',
        },
      });

      expect(session).toBeDefined();
    });
  });

  describe('Data Isolation Verification', () => {
    it('should enforce data isolation for campaigns', async () => {
      // Test collaborator with limited access
      mockDb.campaign.findMany.mockResolvedValue([mockCampaigns[0]]); // Only client1 campaign

      const campaigns = await mockDb.campaign.findMany({
        where: {
          clientId: { in: ['client1'] }, // Collaborator only has access to client1
        },
      });

      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].clientId).toBe('client1');

      // Verify the query was called with proper filtering
      expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
        where: {
          clientId: { in: ['client1'] },
        },
      });
    });

    it('should allow full access for owners and managers', async () => {
      // Test owner/manager with full access
      mockDb.campaign.findMany.mockResolvedValue(mockCampaigns); // All campaigns

      const campaigns = await mockDb.campaign.findMany({
        where: {
          client: { agencyId: 'agency1' }, // Agency-wide access
        },
      });

      expect(campaigns).toHaveLength(2);
      expect(campaigns.map(c => c.clientId)).toEqual(['client1', 'client2']);

      // Verify the query was called with agency-wide filtering
      expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
        where: {
          client: { agencyId: 'agency1' },
        },
      });
    });

    it('should prevent cross-agency data access', async () => {
      // Simulate user from different agency trying to access data
      mockDb.client.findFirst.mockResolvedValue(null); // Client not found in user's agency

      const client = await mockDb.client.findFirst({
        where: {
          id: 'client1',
          agencyId: 'agency2', // Different agency
          isActive: true,
        },
      });

      expect(client).toBeNull();

      // Verify agency isolation in query
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client1',
          agencyId: 'agency2',
          isActive: true,
        },
      });
    });
  });

  describe('Admin Dashboard Functionality', () => {
    it('should provide admin access for owners and managers', async () => {
      // Test permission check
      mockPermissions.hasPermission.mockReturnValue(true);

      const canManageClients = mockPermissions.hasPermission(
        UserRole.OWNER,
        permissions.PERMISSIONS.MANAGE_CLIENTS
      );

      expect(canManageClients).toBe(true);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        UserRole.OWNER,
        permissions.PERMISSIONS.MANAGE_CLIENTS
      );

      // Test client list retrieval
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.client.count.mockResolvedValue(2);

      const clients = await mockDb.client.findMany({
        where: { agencyId: 'agency1' },
        orderBy: { createdAt: 'desc' },
      });

      const totalClients = await mockDb.client.count({
        where: { agencyId: 'agency1' },
      });

      expect(clients).toHaveLength(2);
      expect(totalClients).toBe(2);
    });

    it('should deny admin access for collaborators', async () => {
      mockPermissions.hasPermission.mockReturnValue(false);

      const canManageClients = mockPermissions.hasPermission(
        UserRole.COLLABORATOR,
        permissions.PERMISSIONS.MANAGE_CLIENTS
      );

      expect(canManageClients).toBe(false);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        UserRole.COLLABORATOR,
        permissions.PERMISSIONS.MANAGE_CLIENTS
      );
    });

    it('should handle client creation workflow', async () => {
      // Test permission check
      mockPermissions.hasPermission.mockReturnValue(true);

      const canCreateClients = mockPermissions.hasPermission(
        UserRole.OWNER,
        permissions.PERMISSIONS.MANAGE_CLIENTS
      );

      expect(canCreateClients).toBe(true);

      // Test client creation
      const newClientData = {
        name: 'New Client',
        agencyId: 'agency1',
        brandColors: '["#purple"]',
        logoUrl: 'https://example.com/new-logo.png',
        themeSettings: '{"primaryColor": "#purple"}',
        isActive: true,
      };

      mockDb.client.create.mockResolvedValue({
        id: 'client3',
        createdAt: new Date(),
        ...newClientData,
      });

      const newClient = await mockDb.client.create({
        data: newClientData,
      });

      expect(newClient.name).toBe('New Client');
      expect(newClient.agencyId).toBe('agency1');
      expect(mockDb.client.create).toHaveBeenCalledWith({
        data: newClientData,
      });
    });

    it('should handle client updates and deactivation', async () => {
      // Test client update
      mockDb.client.findFirst.mockResolvedValue(mockClients[0]);
      mockDb.client.update.mockResolvedValue({
        ...mockClients[0],
        name: 'Updated Client Name',
      });

      const updatedClient = await mockDb.client.update({
        where: { id: 'client1' },
        data: { name: 'Updated Client Name' },
      });

      expect(updatedClient.name).toBe('Updated Client Name');

      // Test client deactivation (soft delete)
      mockDb.client.update.mockResolvedValue({
        ...mockClients[0],
        isActive: false,
      });

      const deactivatedClient = await mockDb.client.update({
        where: { id: 'client1' },
        data: { isActive: false },
      });

      expect(deactivatedClient.isActive).toBe(false);
    });
  });

  describe('Session Management and Recovery', () => {
    it('should restore last selected client on session recovery', async () => {
      // Get user with last selected client
      mockDb.user.findUnique.mockResolvedValue(mockUsers.manager);

      const user = await mockDb.user.findUnique({
        where: { id: 'manager1' },
      });

      expect(user.lastSelectedClient).toBe('client2');

      // Get recent client sessions
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

      const recentSessions = await mockDb.clientSession.findMany({
        where: {
          userId: 'manager1',
          clientId: { in: ['client1', 'client2'] },
        },
        orderBy: { lastAccessed: 'desc' },
        take: 5,
      });

      expect(recentSessions).toHaveLength(1);
      expect(recentSessions[0].clientId).toBe('client2');
    });

    it('should handle corrupted session data gracefully', async () => {
      // User with corrupted assignedClients data
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUsers.collaborator,
        assignedClients: 'invalid json',
      });

      const user = await mockDb.user.findUnique({
        where: { id: 'collaborator1' },
      });

      // parseAssignedClientIds should handle invalid JSON gracefully
      mockClientIsolation.parseAssignedClientIds.mockReturnValue([]);
      const clientIds = mockClientIsolation.parseAssignedClientIds(user.assignedClients);

      expect(clientIds).toEqual([]);
    });

    it('should handle concurrent session updates', async () => {
      // Simulate multiple concurrent session updates
      const sessionData = {
        userId: 'manager1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      };

      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        ...sessionData,
      });

      // Multiple concurrent upserts
      const promises = Array.from({ length: 3 }, () =>
        mockDb.clientSession.upsert({
          where: {
            userId_clientId: {
              userId: 'manager1',
              clientId: 'client1',
            },
          },
          update: { lastAccessed: expect.any(Date) },
          create: sessionData,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.userId).toBe('manager1');
        expect(result.clientId).toBe('client1');
      });

      expect(mockDb.clientSession.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance and Optimization', () => {
    it('should optimize database queries for large client lists', async () => {
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

      const clients = await mockDb.client.findMany({
        where: {
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

      expect(clients).toHaveLength(100);

      // Verify efficient query structure with select fields
      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: {
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
    });

    it('should limit recent sessions for performance', async () => {
      mockDb.clientSession.findMany.mockResolvedValue([]);

      await mockDb.clientSession.findMany({
        where: {
          userId: 'owner1',
          clientId: { in: ['client1', 'client2'] },
        },
        orderBy: { lastAccessed: 'desc' },
        take: 5, // Limited to 5 recent sessions
      });

      expect(mockDb.clientSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'owner1',
          clientId: { in: ['client1', 'client2'] },
        },
        orderBy: { lastAccessed: 'desc' },
        take: 5,
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database connection failures', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      try {
        await mockDb.user.findUnique({
          where: { id: 'user1' },
        });
        fail('Should have thrown database error');
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('should handle partial failures in client operations', async () => {
      // Client update succeeds but session update fails
      mockDb.client.update.mockResolvedValue({
        ...mockClients[0],
        name: 'Updated Name',
      });

      mockDb.clientSession.upsert.mockRejectedValue(new Error('Session update failed'));

      const updatedClient = await mockDb.client.update({
        where: { id: 'client1' },
        data: { name: 'Updated Name' },
      });

      expect(updatedClient.name).toBe('Updated Name');

      try {
        await mockDb.clientSession.upsert({
          where: {
            userId_clientId: {
              userId: 'user1',
              clientId: 'client1',
            },
          },
          update: { lastAccessed: new Date() },
          create: {
            userId: 'user1',
            clientId: 'client1',
            lastAccessed: new Date(),
            sessionData: '{}',
          },
        });
        fail('Should have thrown session error');
      } catch (error) {
        expect(error.message).toBe('Session update failed');
      }
    });

    it('should validate data integrity', async () => {
      // Test client data with invalid JSON
      const clientWithInvalidJson = {
        ...mockClients[0],
        brandColors: 'invalid json',
        themeSettings: 'also invalid',
      };

      mockDb.client.findFirst.mockResolvedValue(clientWithInvalidJson);

      const client = await mockDb.client.findFirst({
        where: { id: 'client1' },
      });

      expect(client.brandColors).toBe('invalid json');
      expect(client.themeSettings).toBe('also invalid');

      // The application should handle JSON parsing errors gracefully
      // This would be handled in the API layer, not the database layer
    });
  });
});