import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  withClientIsolation,
  withClientSpecificIsolation,
  withAdminClientAccess,
  withOptionalClientIsolation,
  NextRequestWithClientContext,
  ClientIsolatedQueries,
  createClientIsolatedQueries,
  requireClientContext,
  requireUserContext,
  getClientIdFromRequest,
} from '../../lib/middleware/client-isolation';
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

describe('Client Isolation Middleware Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'user1',
      role: UserRole.MANAGER,
      agencyId: 'agency1',
    },
  };

  const mockUser = {
    id: 'user1',
    assignedClients: '["client1", "client2"]',
  };

  const mockClientContext = {
    clientId: 'client1',
    userId: 'user1',
    userRole: UserRole.MANAGER,
    agencyId: 'agency1',
    permissions: ['read', 'write'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockClientIsolation.parseAssignedClientIds.mockReturnValue(['client1', 'client2']);
    mockClientIsolation.validateClientAccess.mockResolvedValue(true);
    mockClientIsolation.createClientContext.mockResolvedValue(mockClientContext);
  });

  describe('withClientIsolation', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    it('should add user context to request', async () => {
      const middleware = withClientIsolation(mockHandler, {
        requireClientId: false,
        allowAdminAccess: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      await middleware(request as NextRequestWithClientContext);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          userContext: {
            id: 'user1',
            role: UserRole.MANAGER,
            agencyId: 'agency1',
            assignedClientIds: ['client1', 'client2'],
          },
        })
      );
    });

    it('should add client context when client ID is provided', async () => {
      const middleware = withClientIsolation(mockHandler, {
        requireClientId: true,
        clientIdSource: 'header',
        clientIdParam: 'x-client-id',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-client-id': 'client1' },
      });

      await middleware(request as NextRequestWithClientContext);

      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
        'user1',
        UserRole.MANAGER,
        'client1'
      );
      expect(mockClientIsolation.createClientContext).toHaveBeenCalledWith(
        'user1',
        'client1'
      );
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          clientContext: mockClientContext,
        })
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const middleware = withClientIsolation(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await middleware(request as NextRequestWithClientContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Authentication required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when client ID is required but not provided', async () => {
      const middleware = withClientIsolation(mockHandler, {
        requireClientId: true,
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await middleware(request as NextRequestWithClientContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Client ID is required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 403 when client access is denied', async () => {
      mockClientIsolation.validateClientAccess.mockResolvedValue(false);
      const middleware = withClientIsolation(mockHandler, {
        requireClientId: true,
        clientIdSource: 'header',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-client-id': 'client3' },
      });

      const response = await middleware(request as NextRequestWithClientContext);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toBe('Access denied to client');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle ClientAccessError exceptions', async () => {
      const error = new clientIsolation.ClientAccessError('user1', 'client1', 'Custom error');
      mockClientIsolation.validateClientAccess.mockRejectedValue(error);
      
      const middleware = withClientIsolation(mockHandler, {
        requireClientId: true,
        clientIdSource: 'header',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-client-id': 'client1' },
      });

      const response = await middleware(request as NextRequestWithClientContext);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toBe('Custom error');
    });

    it('should extract client ID from different sources', async () => {
      // Test query parameter extraction
      const queryMiddleware = withClientIsolation(mockHandler, {
        clientIdSource: 'query',
        clientIdParam: 'clientId',
      });

      const queryRequest = new NextRequest('http://localhost:3000/api/test?clientId=client1');
      await queryMiddleware(queryRequest as NextRequestWithClientContext);

      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
        'user1',
        UserRole.MANAGER,
        'client1'
      );

      // Test path extraction
      const pathMiddleware = withClientIsolation(mockHandler, {
        clientIdSource: 'path',
      });

      const pathRequest = new NextRequest('http://localhost:3000/api/clients/client2/campaigns');
      await pathMiddleware(pathRequest as NextRequestWithClientContext);

      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
        'user1',
        UserRole.MANAGER,
        'client2'
      );
    });
  });

  describe('Specialized Middleware Functions', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    it('should configure withClientSpecificIsolation correctly', async () => {
      const middleware = withClientSpecificIsolation(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/clients/client1/data');

      await middleware(request as NextRequestWithClientContext);

      expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
        'user1',
        UserRole.MANAGER,
        'client1'
      );
    });

    it('should configure withAdminClientAccess correctly', async () => {
      const middleware = withAdminClientAccess(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/admin/clients');

      await middleware(request as NextRequestWithClientContext);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          userContext: expect.any(Object),
        })
      );
      expect(mockClientIsolation.validateClientAccess).not.toHaveBeenCalled();
    });

    it('should configure withOptionalClientIsolation correctly', async () => {
      const middleware = withOptionalClientIsolation(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/campaigns');

      await middleware(request as NextRequestWithClientContext);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          userContext: expect.any(Object),
        })
      );
    });
  });

  describe('ClientIsolatedQueries', () => {
    const userContext = {
      id: 'user1',
      role: UserRole.COLLABORATOR,
      agencyId: 'agency1',
      assignedClientIds: ['client1', 'client2'],
    };

    let queries: ClientIsolatedQueries;

    beforeEach(() => {
      queries = new ClientIsolatedQueries(userContext);
      mockDb.client.findMany.mockResolvedValue([]);
      mockDb.campaign.findMany.mockResolvedValue([]);
      mockDb.contentJob.findMany.mockResolvedValue([]);
    });

    it('should filter clients for collaborators', async () => {
      await queries.getClients();

      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
          id: { in: ['client1', 'client2'] },
        },
      });
    });

    it('should filter campaigns for collaborators', async () => {
      await queries.getCampaigns({ status: 'ACTIVE' });

      expect(mockDb.campaign.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
          clientId: { in: ['client1', 'client2'] },
          status: 'ACTIVE',
        },
      });
    });

    it('should not filter for owners and managers', async () => {
      const ownerContext = { ...userContext, role: UserRole.OWNER };
      const ownerQueries = new ClientIsolatedQueries(ownerContext);

      await ownerQueries.getClients();

      expect(mockDb.client.findMany).toHaveBeenCalledWith({
        where: {
          agencyId: 'agency1',
        },
      });
    });

    it('should validate client access correctly', () => {
      expect(queries.canAccessClient('client1')).toBe(true);
      expect(queries.canAccessClient('client3')).toBe(false);

      const ownerContext = { ...userContext, role: UserRole.OWNER };
      const ownerQueries = new ClientIsolatedQueries(ownerContext);
      expect(ownerQueries.canAccessClient('any-client')).toBe(true);
    });

    it('should return accessible client IDs', () => {
      expect(queries.getAccessibleClientIds()).toEqual(['client1', 'client2']);
    });
  });

  describe('Helper Functions', () => {
    it('should create client isolated queries from request', () => {
      const request = {
        userContext: {
          id: 'user1',
          role: UserRole.MANAGER,
          agencyId: 'agency1',
          assignedClientIds: ['client1'],
        },
      } as NextRequestWithClientContext;

      const queries = createClientIsolatedQueries(request);
      expect(queries).toBeInstanceOf(ClientIsolatedQueries);
    });

    it('should return null when no user context', () => {
      const request = {} as NextRequestWithClientContext;
      const queries = createClientIsolatedQueries(request);
      expect(queries).toBeNull();
    });

    it('should require client context', () => {
      const requestWithContext = {
        clientContext: mockClientContext,
      } as NextRequestWithClientContext;

      const requestWithoutContext = {} as NextRequestWithClientContext;

      expect(requireClientContext(requestWithContext)).toBe(mockClientContext);
      expect(() => requireClientContext(requestWithoutContext)).toThrow(
        'Client context is required but not found'
      );
    });

    it('should require user context', () => {
      const requestWithContext = {
        userContext: {
          id: 'user1',
          role: UserRole.MANAGER,
          agencyId: 'agency1',
          assignedClientIds: ['client1'],
        },
      } as NextRequestWithClientContext;

      const requestWithoutContext = {} as NextRequestWithClientContext;

      expect(requireUserContext(requestWithContext)).toBe(requestWithContext.userContext);
      expect(() => requireUserContext(requestWithoutContext)).toThrow(
        'User context is required but not found'
      );
    });

    it('should extract client ID from request', () => {
      const headerRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-client-id': 'client1' },
      }) as NextRequestWithClientContext;

      const queryRequest = new NextRequest(
        'http://localhost:3000/api/test?clientId=client2'
      ) as NextRequestWithClientContext;

      const pathRequest = new NextRequest(
        'http://localhost:3000/api/clients/client3/data'
      ) as NextRequestWithClientContext;

      expect(getClientIdFromRequest(headerRequest, 'header', 'x-client-id')).toBe('client1');
      expect(getClientIdFromRequest(queryRequest, 'query', 'clientId')).toBe('client2');
      expect(getClientIdFromRequest(pathRequest, 'path')).toBe('client3');
    });
  });

  describe('Error Handling', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    it('should handle database errors gracefully', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
      
      const middleware = withClientIsolation(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');

      const response = await middleware(request as NextRequestWithClientContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.message).toBe('Internal server error');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle ClientDataIsolationError', async () => {
      const error = new clientIsolation.ClientDataIsolationError('test operation', 'test details');
      mockClientIsolation.createClientContext.mockRejectedValue(error);
      
      const middleware = withClientIsolation(mockHandler, {
        requireClientId: true,
        clientIdSource: 'header',
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-client-id': 'client1' },
      });

      const response = await middleware(request as NextRequestWithClientContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('Data isolation violation');
    });
  });
});