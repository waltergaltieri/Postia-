import { db } from '@/lib/db';
import { randomBytes, createHash } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  clientId: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ApiKeyUsage {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  tokensConsumed?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class ApiKeyService {
  /**
   * Generate a new API key
   */
  static generateApiKey(): { key: string; prefix: string; hash: string } {
    const key = randomBytes(32).toString('hex');
    const prefix = key.substring(0, 8);
    const hash = createHash('sha256').update(key).digest('hex');
    
    return {
      key: `pk_${key}`,
      prefix: `pk_${prefix}`,
      hash,
    };
  }

  /**
   * Create a new API key for a client
   */
  static async createApiKey(
    clientId: string,
    name: string,
    permissions: string[] = ['content:generate'],
    expiresAt?: Date
  ): Promise<{ apiKey: string; keyData: ApiKey }> {
    const { key, prefix, hash } = this.generateApiKey();

    const keyData = await db.apiKey.create({
      data: {
        name,
        keyPrefix: prefix,
        hashedKey: hash,
        clientId,
        permissions,
        isActive: true,
        expiresAt,
      },
    });

    return {
      apiKey: key,
      keyData: keyData as ApiKey,
    };
  }

  /**
   * Validate and retrieve API key information
   */
  static async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    if (!apiKey.startsWith('pk_')) {
      return null;
    }

    const hash = createHash('sha256').update(apiKey).digest('hex');
    
    const keyData = await db.apiKey.findFirst({
      where: {
        hashedKey: hash,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
            agencyId: true,
          },
        },
      },
    });

    if (!keyData) {
      return null;
    }

    // Update last used timestamp
    await db.apiKey.update({
      where: { id: keyData.id },
      data: { lastUsedAt: new Date() },
    });

    return keyData as ApiKey;
  }

  /**
   * Check if API key has specific permission
   */
  static hasPermission(apiKey: ApiKey, permission: string): boolean {
    return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
  }

  /**
   * Log API key usage
   */
  static async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    tokensConsumed?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await db.apiKeyUsage.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        tokensConsumed,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get API key usage statistics
   */
  static async getUsageStats(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokensConsumed: number;
    requestsByEndpoint: Array<{ endpoint: string; count: number }>;
  }> {
    const where: any = { apiKeyId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalRequests, successfulRequests, failedRequests, tokenUsage, requestsByEndpoint] = await Promise.all([
      db.apiKeyUsage.count({ where }),
      db.apiKeyUsage.count({ where: { ...where, statusCode: { gte: 200, lt: 300 } } }),
      db.apiKeyUsage.count({ where: { ...where, statusCode: { gte: 400 } } }),
      db.apiKeyUsage.aggregate({
        where,
        _sum: { tokensConsumed: true },
      }),
      db.apiKeyUsage.groupBy({
        by: ['endpoint'],
        where,
        _count: true,
        orderBy: { _count: { endpoint: 'desc' } },
      }),
    ]);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokensConsumed: tokenUsage._sum.tokensConsumed || 0,
      requestsByEndpoint: requestsByEndpoint.map(item => ({
        endpoint: item.endpoint,
        count: item._count,
      })),
    };
  }

  /**
   * Revoke API key
   */
  static async revokeApiKey(apiKeyId: string): Promise<void> {
    await db.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });
  }

  /**
   * List API keys for a client
   */
  static async listClientApiKeys(clientId: string): Promise<ApiKey[]> {
    const keys = await db.apiKey.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return keys as ApiKey[];
  }

  /**
   * Get API key by ID (without sensitive data)
   */
  static async getApiKeyById(apiKeyId: string): Promise<Omit<ApiKey, 'hashedKey'> | null> {
    const keyData = await db.apiKey.findUnique({
      where: { id: apiKeyId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        clientId: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return keyData;
  }
}