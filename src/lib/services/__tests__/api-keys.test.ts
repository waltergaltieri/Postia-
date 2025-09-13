import { ApiKeyService } from '../api-keys';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    apiKey: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    apiKeyUsage: {
      create: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    agency: {
      update: jest.fn(),
    },
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mockedrandomstring123456789012345678901234567890'),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mockedhash'),
  })),
}));

describe('ApiKeyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateApiKey', () => {
    it('should generate API key with correct format', () => {
      const result = ApiKeyService.generateApiKey();

      expect(result.key).toBe('pk_mockedrandomstring123456789012345678901234567890');
      expect(result.prefix).toBe('pk_mockedra');
      expect(result.hash).toBe('mockedhash');
    });
  });

  describe('createApiKey', () => {
    it('should create API key successfully', async () => {
      const mockKeyData = {
        id: 'key-1',
        name: 'Test Key',
        keyPrefix: 'pk_mockedra',
        hashedKey: 'mockedhash',
        clientId: 'client-1',
        permissions: ['content:generate'],
        isActive: true,
        expiresAt: null,
        createdAt: new Date(),
      };

      (db.apiKey.create as jest.Mock).mockResolvedValue(mockKeyData);

      const result = await ApiKeyService.createApiKey(
        'client-1',
        'Test Key',
        ['content:generate']
      );

      expect(result.apiKey).toBe('pk_mockedrandomstring123456789012345678901234567890');
      expect(result.keyData).toEqual(mockKeyData);
      expect(db.apiKey.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Key',
          keyPrefix: 'pk_mockedra',
          hashedKey: 'mockedhash',
          clientId: 'client-1',
          permissions: ['content:generate'],
          isActive: true,
          expiresAt: undefined,
        },
      });
    });

    it('should create API key with expiration date', async () => {
      const expirationDate = new Date('2024-12-31');
      const mockKeyData = {
        id: 'key-1',
        name: 'Test Key',
        keyPrefix: 'pk_mockedra',
        hashedKey: 'mockedhash',
        clientId: 'client-1',
        permissions: ['content:generate'],
        isActive: true,
        expiresAt: expirationDate,
        createdAt: new Date(),
      };

      (db.apiKey.create as jest.Mock).mockResolvedValue(mockKeyData);

      const result = await ApiKeyService.createApiKey(
        'client-1',
        'Test Key',
        ['content:generate'],
        expirationDate
      );

      expect(result.keyData.expiresAt).toEqual(expirationDate);
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key', async () => {
      const mockKeyData = {
        id: 'key-1',
        name: 'Test Key',
        keyPrefix: 'pk_mockedra',
        hashedKey: 'mockedhash',
        clientId: 'client-1',
        permissions: ['content:generate'],
        isActive: true,
        expiresAt: null,
        client: {
          id: 'client-1',
          brandName: 'Test Client',
          agencyId: 'agency-1',
        },
      };

      (db.apiKey.findFirst as jest.Mock).mockResolvedValue(mockKeyData);
      (db.apiKey.update as jest.Mock).mockResolvedValue({});

      const result = await ApiKeyService.validateApiKey('pk_testkey123');

      expect(result).toEqual(mockKeyData);
      expect(db.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should return null for invalid API key format', async () => {
      const result = await ApiKeyService.validateApiKey('invalid_key');

      expect(result).toBeNull();
      expect(db.apiKey.findFirst).not.toHaveBeenCalled();
    });

    it('should return null for non-existent API key', async () => {
      (db.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await ApiKeyService.validateApiKey('pk_nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for expired API key', async () => {
      const expiredDate = new Date('2020-01-01');
      const mockKeyData = {
        id: 'key-1',
        expiresAt: expiredDate,
        isActive: true,
      };

      // The database query should not return expired keys due to the WHERE clause
      (db.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await ApiKeyService.validateApiKey('pk_expired');

      expect(result).toBeNull();
    });
  });

  describe('hasPermission', () => {
    const mockApiKey = {
      id: 'key-1',
      permissions: ['content:generate', 'content:read'],
    } as any;

    it('should return true for granted permission', () => {
      const result = ApiKeyService.hasPermission(mockApiKey, 'content:generate');
      expect(result).toBe(true);
    });

    it('should return false for non-granted permission', () => {
      const result = ApiKeyService.hasPermission(mockApiKey, 'admin:manage');
      expect(result).toBe(false);
    });

    it('should return true for wildcard permission', () => {
      const wildcardKey = { ...mockApiKey, permissions: ['*'] };
      const result = ApiKeyService.hasPermission(wildcardKey, 'any:permission');
      expect(result).toBe(true);
    });
  });

  describe('logUsage', () => {
    it('should log API key usage', async () => {
      (db.apiKeyUsage.create as jest.Mock).mockResolvedValue({});

      await ApiKeyService.logUsage(
        'key-1',
        '/api/test',
        'POST',
        200,
        50,
        '127.0.0.1',
        'test-agent'
      );

      expect(db.apiKeyUsage.create).toHaveBeenCalledWith({
        data: {
          apiKeyId: 'key-1',
          endpoint: '/api/test',
          method: 'POST',
          statusCode: 200,
          tokensConsumed: 50,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const mockStats = {
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        tokenUsage: { _sum: { tokensConsumed: 1000 } },
        requestsByEndpoint: [
          { endpoint: '/api/generate', _count: 50 },
          { endpoint: '/api/status', _count: 50 },
        ],
      };

      (db.apiKeyUsage.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalRequests
        .mockResolvedValueOnce(95)  // successfulRequests
        .mockResolvedValueOnce(5);  // failedRequests

      (db.apiKeyUsage.aggregate as jest.Mock).mockResolvedValue({
        _sum: { tokensConsumed: 1000 },
      });

      (db.apiKeyUsage.groupBy as jest.Mock).mockResolvedValue([
        { endpoint: '/api/generate', _count: 50 },
        { endpoint: '/api/status', _count: 50 },
      ]);

      const result = await ApiKeyService.getUsageStats('key-1');

      expect(result).toEqual({
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        totalTokensConsumed: 1000,
        requestsByEndpoint: [
          { endpoint: '/api/generate', count: 50 },
          { endpoint: '/api/status', count: 50 },
        ],
      });
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke API key by setting isActive to false', async () => {
      (db.apiKey.update as jest.Mock).mockResolvedValue({});

      await ApiKeyService.revokeApiKey('key-1');

      expect(db.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { isActive: false },
      });
    });
  });

  describe('listClientApiKeys', () => {
    it('should return list of API keys for client', async () => {
      const mockKeys = [
        { id: 'key-1', name: 'Key 1', clientId: 'client-1' },
        { id: 'key-2', name: 'Key 2', clientId: 'client-1' },
      ];

      (db.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys);

      const result = await ApiKeyService.listClientApiKeys('client-1');

      expect(result).toEqual(mockKeys);
      expect(db.apiKey.findMany).toHaveBeenCalledWith({
        where: { clientId: 'client-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});