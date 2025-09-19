/**
 * Database query optimization utilities for multi-tenant client filtering
 * Implements optimized queries, connection pooling, and performance monitoring
 */

import { PrismaClient } from '@prisma/client'
import { clientDataCache, CacheKeys } from '../cache/client-cache'

// Enhanced Prisma client with connection pooling and optimization
class OptimizedPrismaClient extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Connection pool configuration
      __internal: {
        engine: {
          // Connection pool settings for better performance
          connection_limit: 10,
          pool_timeout: 10,
          schema_path: './prisma/schema.prisma'
        }
      }
    })

    // Add query performance monitoring
    this.$use(this.performanceMiddleware)
    this.$use(this.clientFilterMiddleware)
  }

  // Middleware to monitor query performance
  private performanceMiddleware = async (params: any, next: any) => {
    const start = Date.now()
    const result = await next(params)
    const duration = Date.now() - start

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`)
    }

    return result
  }

  // Middleware to automatically add client filtering where applicable
  private clientFilterMiddleware = async (params: any, next: any) => {
    // Models that should be filtered by client
    const clientFilteredModels = ['Campaign', 'ContentJob']
    
    if (clientFilteredModels.includes(params.model)) {
      // Add client filtering if not already present and clientId is available
      if (params.args?.where && !params.args.where.clientId && global.currentClientId) {
        params.args.where.clientId = global.currentClientId
      }
    }

    return next(params)
  }
}

// Singleton instance
let prismaInstance: OptimizedPrismaClient | null = null

export function getOptimizedPrisma(): OptimizedPrismaClient {
  if (!prismaInstance) {
    prismaInstance = new OptimizedPrismaClient()
  }
  return prismaInstance
}

// Optimized query builders for common multi-tenant operations
export class ClientQueryBuilder {
  private prisma: OptimizedPrismaClient

  constructor() {
    this.prisma = getOptimizedPrisma()
  }

  /**
   * Get campaigns for a specific client with optimized query
   */
  async getCampaignsForClient(clientId: string, options: {
    limit?: number
    offset?: number
    status?: string
    includeJobs?: boolean
  } = {}) {
    const { limit = 50, offset = 0, status, includeJobs = false } = options

    const cacheKey = `campaigns:${clientId}:${JSON.stringify(options)}`
    const cached = clientDataCache.get(cacheKey)
    if (cached) return cached

    const where: any = { clientId }
    if (status) where.status = status

    const campaigns = await this.prisma.campaign.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: includeJobs ? {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Limit jobs per campaign
        }
      } : undefined,
      // Use cursor-based pagination for better performance on large datasets
      ...(offset > 0 && {
        cursor: { id: 'cursor_id' }
      })
    })

    // Cache for 5 minutes
    clientDataCache.set(cacheKey, campaigns, 5 * 60 * 1000)
    return campaigns
  }

  /**
   * Get content jobs for a client with optimized filtering
   */
  async getContentJobsForClient(clientId: string, options: {
    limit?: number
    offset?: number
    status?: string
    type?: string
    campaignId?: string
  } = {}) {
    const { limit = 50, offset = 0, status, type, campaignId } = options

    const cacheKey = `jobs:${clientId}:${JSON.stringify(options)}`
    const cached = clientDataCache.get(cacheKey)
    if (cached) return cached

    const where: any = { clientId }
    if (status) where.status = status
    if (type) where.type = type
    if (campaignId) where.campaignId = campaignId

    const jobs = await this.prisma.contentJob.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Cache for 2 minutes (jobs change more frequently)
    clientDataCache.set(cacheKey, jobs, 2 * 60 * 1000)
    return jobs
  }

  /**
   * Get client statistics with optimized aggregation
   */
  async getClientStats(clientId: string) {
    const cacheKey = `stats:${clientId}`
    const cached = clientDataCache.get(cacheKey)
    if (cached) return cached

    // Use raw SQL for better performance on aggregations
    const stats = await this.prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT c.id) as totalCampaigns,
        COUNT(DISTINCT cj.id) as totalJobs,
        COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE' THEN c.id END) as activeCampaigns,
        COUNT(DISTINCT CASE WHEN cj.status = 'COMPLETED' THEN cj.id END) as completedJobs,
        SUM(cj.tokensConsumed) as totalTokensConsumed
      FROM Client cl
      LEFT JOIN Campaign c ON c.clientId = cl.id
      LEFT JOIN ContentJob cj ON cj.clientId = cl.id
      WHERE cl.id = ${clientId}
    `

    // Cache for 10 minutes
    clientDataCache.set(cacheKey, stats, 10 * 60 * 1000)
    return stats
  }

  /**
   * Bulk operations for better performance
   */
  async bulkUpdateCampaignStatus(clientId: string, campaignIds: string[], status: string) {
    // Invalidate related caches
    clientDataCache.invalidatePattern(`campaigns:${clientId}`)
    
    return this.prisma.campaign.updateMany({
      where: {
        id: { in: campaignIds },
        clientId // Ensure client isolation
      },
      data: { status }
    })
  }

  /**
   * Optimized client access validation
   */
  async validateClientAccess(userId: string, clientId: string): Promise<boolean> {
    const cacheKey = `access:${userId}:${clientId}`
    const cached = clientDataCache.get<boolean>(cacheKey)
    if (cached !== null) return cached

    // Use exists for better performance than findFirst
    const hasAccess = await this.prisma.user.findFirst({
      where: {
        id: userId,
        OR: [
          // User is in the same agency as the client
          {
            agency: {
              clients: {
                some: { id: clientId }
              }
            }
          },
          // User has explicit access to this client
          {
            assignedClients: {
              contains: clientId
            }
          }
        ]
      },
      select: { id: true }
    })

    const result = !!hasAccess
    
    // Cache for 5 minutes
    clientDataCache.set(cacheKey, result, 5 * 60 * 1000)
    return result
  }

  /**
   * Get user's accessible clients with optimized query
   */
  async getUserAccessibleClients(userId: string) {
    const cacheKey = `user-clients:${userId}`
    const cached = clientDataCache.get(cacheKey)
    if (cached) return cached

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        agency: {
          include: {
            clients: {
              where: { isActive: true },
              orderBy: { name: 'asc' }
            }
          }
        }
      }
    })

    if (!user?.agency) return []

    let accessibleClients = user.agency.clients

    // Filter by assigned clients if user has specific assignments
    if (user.assignedClients && user.assignedClients !== '[]') {
      try {
        const assignedIds = JSON.parse(user.assignedClients)
        accessibleClients = accessibleClients.filter(client => 
          assignedIds.includes(client.id)
        )
      } catch (error) {
        console.error('Error parsing assigned clients:', error)
      }
    }

    // Cache for 10 minutes
    clientDataCache.set(cacheKey, accessibleClients, 10 * 60 * 1000)
    return accessibleClients
  }
}

// Connection pool management
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager
  private connections = new Map<string, OptimizedPrismaClient>()
  private maxConnections = 10
  private connectionTimeout = 30000 // 30 seconds

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager()
    }
    return ConnectionPoolManager.instance
  }

  getConnection(key: string = 'default'): OptimizedPrismaClient {
    if (!this.connections.has(key)) {
      if (this.connections.size >= this.maxConnections) {
        // Remove oldest connection
        const firstKey = this.connections.keys().next().value
        const oldConnection = this.connections.get(firstKey)
        oldConnection?.$disconnect()
        this.connections.delete(firstKey)
      }

      this.connections.set(key, new OptimizedPrismaClient())
    }

    return this.connections.get(key)!
  }

  async closeAllConnections(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.values()).map(
      connection => connection.$disconnect()
    )
    
    await Promise.all(disconnectPromises)
    this.connections.clear()
  }

  getStats() {
    return {
      activeConnections: this.connections.size,
      maxConnections: this.maxConnections
    }
  }
}

// Export singleton instances
export const clientQueryBuilder = new ClientQueryBuilder()
export const connectionPool = ConnectionPoolManager.getInstance()

// Cleanup on process exit
process.on('beforeExit', async () => {
  await connectionPool.closeAllConnections()
})

// Global client context for middleware
declare global {
  var currentClientId: string | undefined
}

export function setGlobalClientContext(clientId: string | undefined) {
  global.currentClientId = clientId
}