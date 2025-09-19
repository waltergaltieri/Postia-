import {
  ClientAccessError,
  ClientDataIsolationError,
  ClientPermissionError,
  parseAssignedClientIds,
  parseClientPermissions,
  validateClientAccessSync,
  validateClientAccess,
  validateClientPermission,
  getUserAccessibleClientIds,
  validateMultipleClientAccess,
  validateSessionClientAccess,
  requireClientAccess,
  requireClientPermission,
  createClientContext,
  filterByClientAccess,
  addClientFilter,
  validateClientExistsAndAccess,
} from '../client-isolation';
import { UserRole } from '../../generated/prisma';
import { db } from '../db';

// Mock the database
jest.mock('../db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    clientSession: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('Client Isolation Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Classes', () => {
    it('should create ClientAccessError with correct message', () => {
      const error = new ClientAccessError('user123', 'client456');
      expect(error.name).toBe('ClientAccessError');
      expect(error.message).toBe('User user123 does not have access to client client456');
    });

    it('should create ClientAccessError with custom message', () => {
      const error = new ClientAccessError('user123', 'client456', 'Custom error message');
      expect(error.message).toBe('Custom error message');
    });

    it('should create ClientDataIsolationError with correct message', () => {
      const error = new ClientDataIsolationError('getData');
      expect(error.name).toBe('ClientDataIsolationError');
      expect(error.message).toBe('Data isolation violation in operation: getData');
    });

    it('should create ClientPermissionError with correct message', () => {
      const error = new ClientPermissionError('user123', 'client456', 'write');
      expect(error.name).toBe('ClientPermissionError');
      expect(error.message).toBe("User user123 lacks permission 'write' for client client456");
    });
  });

  describe('parseAssignedClientIds', () => {
    it('should parse valid JSON array', () => {
      const result = parseAssignedClientIds('["client1", "client2", "client3"]');
      expect(result).toEqual(['client1', 'client2', 'client3']);
    });

    it('should return empty array for null input', () => {
      const result = parseAssignedClientIds(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const result = parseAssignedClientIds('invalid json');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array JSON', () => {
      const result = parseAssignedClientIds('{"key": "value"}');
      expect(result).toEqual([]);
    });
  });

  describe('parseClientPermissions', () => {
    it('should parse valid JSON object', () => {
      const input = '{"client1": ["read", "write"], "client2": ["read"]}';
      const result = parseClientPermissions(input);
      expect(result).toEqual({
        client1: ['read', 'write'],
        client2: ['read']
      });
    });

    it('should return empty object for null input', () => {
      const result = parseClientPermissions(null);
      expect(result).toEqual({});
    });

    it('should return empty object for invalid JSON', () => {
      const result = parseClientPermissions('invalid json');
      expect(result).toEqual({});
    });

    it('should return empty object for non-object JSON', () => {
      const result = parseClientPermissions('["array", "not", "object"]');
      expect(result).toEqual({});
    });
  });

  describe('validateClientAccessSync', () => {
    it('should allow OWNER to access any client', () => {
      const result = validateClientAccessSync(UserRole.OWNER, [], 'any-client');
      expect(result).toBe(true);
    });

    it('should allow MANAGER to access any client', () => {
      const result = validateClientAccessSync(UserRole.MANAGER, [], 'any-client');
      expect(result).toBe(true);
    });

    it('should allow COLLABORATOR to access assigned client', () => {
      const assignedClients = ['client1', 'client2'];
      const result = validateClientAccessSync(UserRole.COLLABORATOR, assignedClients, 'client1');
      expect(result).toBe(true);
    });

    it('should deny COLLABORATOR access to non-assigned client', () => {
      const assignedClients = ['client1', 'client2'];
      const result = validateClientAccessSync(UserRole.COLLABORATOR, assignedClients, 'client3');
      expect(result).toBe(false);
    });
  });

  describe('validateClientAccess', () => {
    it('should allow OWNER access after verifying agency', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1'
      });
      mockDb.client.findFirst.mockResolvedValue({
        id: 'client1',
        agencyId: 'agency1'
      });

      const result = await validateClientAccess('user1', UserRole.OWNER, 'client1');
      expect(result).toBe(true);
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: { agencyId: true }
      });
      expect(mockDb.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'client1',
          agencyId: 'agency1'
        }
      });
    });

    it('should deny OWNER access if client not in same agency', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1'
      });
      mockDb.client.findFirst.mockResolvedValue(null);

      const result = await validateClientAccess('user1', UserRole.OWNER, 'client1');
      expect(result).toBe(false);
    });

    it('should allow COLLABORATOR access to assigned client', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        assignedClients: '["client1", "client2"]'
      });

      const result = await validateClientAccess('user1', UserRole.COLLABORATOR, 'client1');
      expect(result).toBe(true);
    });

    it('should deny COLLABORATOR access to non-assigned client', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        assignedClients: '["client1", "client2"]'
      });

      const result = await validateClientAccess('user1', UserRole.COLLABORATOR, 'client3');
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await validateClientAccess('user1', UserRole.OWNER, 'client1');
      expect(result).toBe(false);
    });
  });

  describe('validateClientPermission', () => {
    it('should allow OWNER all permissions', () => {
      const result = validateClientPermission(UserRole.OWNER, {}, 'client1', 'write');
      expect(result).toBe(true);
    });

    it('should check client-specific permissions for non-owners', () => {
      const permissions = {
        client1: ['read', 'write'],
        client2: ['read']
      };

      expect(validateClientPermission(UserRole.MANAGER, permissions, 'client1', 'write')).toBe(true);
      expect(validateClientPermission(UserRole.MANAGER, permissions, 'client1', 'delete')).toBe(false);
      expect(validateClientPermission(UserRole.MANAGER, permissions, 'client2', 'write')).toBe(false);
    });

    it('should deny permission if client not in permissions object', () => {
      const permissions = { client1: ['read'] };
      const result = validateClientPermission(UserRole.MANAGER, permissions, 'client2', 'read');
      expect(result).toBe(false);
    });
  });

  describe('getUserAccessibleClientIds', () => {
    it('should return all agency clients for OWNER', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1',
        assignedClients: null
      });
      mockDb.client.findMany.mockResolvedValue([
        { id: 'client1' },
        { id: 'client2' },
        { id: 'client3' }
      ]);

      const result = await getUserAccessibleClientIds('user1', UserRole.OWNER);
      expect(result).toEqual(['client1', 'client2', 'client3']);
    });

    it('should return assigned clients for COLLABORATOR', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1',
        assignedClients: '["client1", "client3"]'
      });

      const result = await getUserAccessibleClientIds('user1', UserRole.COLLABORATOR);
      expect(result).toEqual(['client1', 'client3']);
    });

    it('should return empty array if user has no agency', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: null,
        assignedClients: null
      });

      const result = await getUserAccessibleClientIds('user1', UserRole.OWNER);
      expect(result).toEqual([]);
    });
  });

  describe('validateMultipleClientAccess', () => {
    it('should separate accessible and denied clients', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1',
        assignedClients: '["client1", "client3"]'
      });

      const result = await validateMultipleClientAccess(
        'user1',
        UserRole.COLLABORATOR,
        ['client1', 'client2', 'client3', 'client4']
      );

      expect(result.accessible).toEqual(['client1', 'client3']);
      expect(result.denied).toEqual(['client2', 'client4']);
    });
  });

  describe('requireClientAccess', () => {
    it('should not throw for valid access', () => {
      expect(() => {
        requireClientAccess(UserRole.OWNER, [], 'client1', 'user1');
      }).not.toThrow();
    });

    it('should throw ClientAccessError for invalid access', () => {
      expect(() => {
        requireClientAccess(UserRole.COLLABORATOR, ['client2'], 'client1', 'user1');
      }).toThrow(ClientAccessError);
    });
  });

  describe('requireClientPermission', () => {
    it('should not throw for OWNER', () => {
      expect(() => {
        requireClientPermission(UserRole.OWNER, {}, 'client1', 'write', 'user1');
      }).not.toThrow();
    });

    it('should throw ClientPermissionError for insufficient permissions', () => {
      const permissions = { client1: ['read'] };
      expect(() => {
        requireClientPermission(UserRole.MANAGER, permissions, 'client1', 'write', 'user1');
      }).toThrow(ClientPermissionError);
    });
  });

  describe('createClientContext', () => {
    it('should create valid client context', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        role: UserRole.MANAGER,
        agencyId: 'agency1',
        assignedClients: '["client1"]',
        clientPermissions: '{"client1": ["read", "write"]}'
      });

      const result = await createClientContext('user1', 'client1');

      expect(result).toEqual({
        clientId: 'client1',
        userId: 'user1',
        userRole: UserRole.MANAGER,
        agencyId: 'agency1',
        permissions: ['read', 'write']
      });
    });

    it('should return null for invalid access', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        role: UserRole.COLLABORATOR,
        agencyId: 'agency1',
        assignedClients: '["client2"]',
        clientPermissions: '{}'
      });

      const result = await createClientContext('user1', 'client1');
      expect(result).toBeNull();
    });
  });

  describe('filterByClientAccess', () => {
    it('should filter data by accessible client IDs', () => {
      const data = [
        { id: '1', clientId: 'client1', name: 'Item 1' },
        { id: '2', clientId: 'client2', name: 'Item 2' },
        { id: '3', clientId: 'client3', name: 'Item 3' }
      ];
      const accessibleClientIds = ['client1', 'client3'];

      const result = filterByClientAccess(data, accessibleClientIds);
      expect(result).toEqual([
        { id: '1', clientId: 'client1', name: 'Item 1' },
        { id: '3', clientId: 'client3', name: 'Item 3' }
      ]);
    });
  });

  describe('addClientFilter', () => {
    it('should return agency filter for OWNER', () => {
      const result = addClientFilter(UserRole.OWNER, [], 'agency1');
      expect(result).toEqual({
        client: {
          agencyId: 'agency1'
        }
      });
    });

    it('should return client ID filter for COLLABORATOR', () => {
      const result = addClientFilter(UserRole.COLLABORATOR, ['client1', 'client2'], 'agency1');
      expect(result).toEqual({
        clientId: {
          in: ['client1', 'client2']
        }
      });
    });
  });

  describe('validateClientExistsAndAccess', () => {
    it('should validate client exists and user has access', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1',
        assignedClients: '["client1"]'
      });
      mockDb.client.findFirst.mockResolvedValue({
        id: 'client1',
        name: 'Test Client',
        agencyId: 'agency1'
      });

      const result = await validateClientExistsAndAccess('user1', UserRole.COLLABORATOR, 'client1');
      
      expect(result.client).toEqual({
        id: 'client1',
        name: 'Test Client',
        agencyId: 'agency1'
      });
      expect(result.hasAccess).toBe(true);
    });

    it('should throw error if user has no agency', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: null,
        assignedClients: null
      });

      await expect(
        validateClientExistsAndAccess('user1', UserRole.COLLABORATOR, 'client1')
      ).rejects.toThrow(ClientAccessError);
    });

    it('should throw error if client not found', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user1',
        agencyId: 'agency1',
        assignedClients: '["client1"]'
      });
      mockDb.client.findFirst.mockResolvedValue(null);

      await expect(
        validateClientExistsAndAccess('user1', UserRole.COLLABORATOR, 'client1')
      ).rejects.toThrow(ClientAccessError);
    });
  });
});