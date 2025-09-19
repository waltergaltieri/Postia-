import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { POST as switchClientPOST, GET as switchClientGET } from '../../app/api/clients/switch/route';
import { UserRole } from '../../generated/prisma';
import { db } from '../../lib/db';
import * as clientIsolation from '../../lib/client-isolation';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../lib/db');
jest.mock('../../lib/client-isolation');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDb = db as jest.Mocked<typeof db>;
const mockClientIsolation = clientIsolation as jest.Mocked<typeof clientIsolation>;

describe('Client Switching API Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'user1',
      role: UserRole.MANAGER,
      agencyId: 'agency1',
    },
  };

  const mockClient = {
    id: 'client1',
    name: 'Test Client',
    brandColors: '["#ff0000", "#00ff00"]',
    logoUrl: 'https://example.com/logo.png',
    themeSettings: '{"primaryColor": "#ff0000"}',
  };

  const mockUser = {
    id: 'user1',
    lastSelectedClient: 'client1',
    assignedClients: '["client1", "client2"]',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
    mockClientIsolation.validateClientAccess.mockResolvedValue(true);
    mockClientIsolation.parseAssignedClientIds.mockReturnValue(['client1', 'client2']);
  });

  describe('POST /api/clients/switch', () => {
    it('should successfully switch to a valid client', async () => {
      mockDb.client.findFirst.mockResolvedValue(mockClient);
      mockDb.user.update.mockResolvedValue(mockUser);
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.client).toEqual({
        id: 'client1',
        name: 'Test Client',
        brandColors: ['#ff0000', '#00ff00'],
        logoUrl: 'https://example.com/logo.png',
        themeSettings: { primaryColor: '#ff0000' },
      });

      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
        'user1',
        UserRole.MANAGER,
        'client1'
      );
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { lastSelectedClient: 'client1' },
      });
      expect(mockDb.clientSession.upsert).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Authentication required');
    });

    it('should return 400 for missing client ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Client ID is required');
    });

    it('should return 403 for denied client access', async () => {
      mockClientIsolation.validateClientAccess.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client3' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toBe('Access denied to this client');
    });

    it('should return 404 for non-existent client', async () => {
      mockDb.client.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'nonexistent' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toBe('Client not found or inactive');
    });

    it('should handle invalid JSON in client settings gracefully', async () => {
      const clientWithInvalidJson = {
        ...mockClient,
        brandColors: 'invalid json',
        themeSettings: 'also invalid',
      };
      mockDb.client.findFirst.mockResolvedValue(clientWithInvalidJson);
      mockDb.user.update.mockResolvedValue(mockUser);
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.client.brandColors).toEqual(['#3b82f6']); // Default color
      expect(data.data.client.themeSettings).toEqual({}); // Default empty object
    });

    it('should handle ClientAccessError exceptions', async () => {
      const error = new clientIsolation.ClientAccessError('user1', 'client1', 'Custom access error');
      mockClientIsolation.validateClientAccess.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toBe('Custom access error');
    });

    it('should handle database errors', async () => {
      mockDb.client.findFirst.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.message).toBe('Failed to switch client');
    });
  });

  describe('GET /api/clients/switch', () => {
    const mockClients = [
      {
        id: 'client1',
        name: 'Client One',
        brandColors: '["#ff0000"]',
        logoUrl: 'https://example.com/logo1.png',
        themeSettings: '{"theme": "red"}',
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'client2',
        name: 'Client Two',
        brandColors: null,
        logoUrl: null,
        themeSettings: null,
        createdAt: new Date('2023-01-02'),
      },
    ];

    const mockRecentSessions = [
      {
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date('2023-12-01'),
        sessionData: '{}',
        client: {
          id: 'client1',
          name: 'Client One',
          brandColors: '["#ff0000"]',
          logoUrl: 'https://example.com/logo1.png',
        },
      },
    ];

    it('should return client switch data for managers', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.clientSession.findMany.mockResolvedValue(mockRecentSessions);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.currentClientId).toBe('client1');
      expect(data.data.userRole).toBe(UserRole.MANAGER);
      expect(data.data.accessibleClients).toHaveLength(2);
      expect(data.data.recentSessions).toHaveLength(1);

      // Check that all agency clients are returned for managers
      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: expect.any(Array) },
          agencyId: 'agency1',
          isActive: true,
        },
        select: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });

    it('should return filtered clients for collaborators', async () => {
      const collaboratorSession = {
        ...mockSession,
        user: { ...mockSession.user, role: UserRole.COLLABORATOR },
      };
      mockGetServerSession.mockResolvedValue(collaboratorSession);
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.client.findMany.mockResolvedValue([mockClients[0]]); // Only assigned client
      mockDb.clientSession.findMany.mockResolvedValue(mockRecentSessions);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.accessibleClients).toHaveLength(1);
      expect(data.data.userRole).toBe(UserRole.COLLABORATOR);
    });

    it('should handle clients with null settings gracefully', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.client.findMany.mockResolvedValue([mockClients[1]]); // Client with null settings
      mockDb.clientSession.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const client = data.data.accessibleClients[0];
      expect(client.brandColors).toEqual(['#3b82f6']); // Default color
      expect(client.themeSettings).toEqual({}); // Default empty object
      expect(client.logoUrl).toBeNull();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Authentication required');
    });

    it('should return 404 for non-existent user', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toBe('User not found');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.message).toBe('Failed to get client switch data');
    });

    it('should format recent sessions correctly', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.clientSession.findMany.mockResolvedValue(mockRecentSessions);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      const response = await switchClientGET(request);
      const data = await response.json();

      expect(data.data.recentSessions[0]).toEqual({
        clientId: 'client1',
        clientName: 'Client One',
        logoUrl: 'https://example.com/logo1.png',
        lastAccessed: expect.any(String),
      });
    });

    it('should limit recent sessions to 5', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser);
      mockDb.client.findMany.mockResolvedValue(mockClients);
      mockDb.clientSession.findMany.mockResolvedValue(mockRecentSessions);

      const request = new NextRequest('http://localhost:3000/api/clients/switch');
      await switchClientGET(request);

      expect(mockDb.clientSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          clientId: { in: expect.any(Array) },
        },
        orderBy: { lastAccessed: 'desc' },
        take: 5,
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

  describe('Client Access Validation Integration', () => {
    it('should validate client access through the entire flow', async () => {
      // Test the complete flow from API call to database validation
      mockDb.client.findFirst.mockResolvedValue(mockClient);
      mockDb.user.update.mockResolvedValue(mockUser);
      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: '{}',
      });

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client1' }),
        headers: { 'content-type': 'application/json' },
      });

      await switchClientPOST(request);

      // Verify the complete validation chain
      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
        'user1',
        UserRole.MANAGER,
        'client1'
      );
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client1',
          agencyId: 'agency1',
          isActive: true,
        },
        select: expect.any(Object),
      });
    });

    it('should enforce agency isolation', async () => {
      // Client exists but belongs to different agency
      mockDb.client.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/clients/switch', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'other-agency-client' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await switchClientPOST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toBe('Client not found or inactive');
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'other-agency-client',
          agencyId: 'agency1', // Should only look in user's agency
          isActive: true,
        },
        select: expect.any(Object),
      });
    });
  });
});