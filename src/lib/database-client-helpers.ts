import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';
import { 
  parseAssignedClientIds,
  validateClientAccessSync,
  ClientAccessError,
  addClientFilter
} from '@/lib/client-isolation';
import { 
  clientQueryBuilder, 
  getOptimizedPrisma,
  setGlobalClientContext 
} from '@/lib/database/query-optimization';
import { clientDataCache, CacheKeys } from '@/lib/cache/client-cache';

/**
 * Database query helpers with automatic client filtering
 */

/**
 * User context for database operations
 */
export interface UserContext {
  id: string;
  role: UserRole;
  agencyId: string;
  assignedClientIds: string[];
}

/**
 * Create user context from session or user data
 */
export async function createUserContext(userId: string): Promise<UserContext | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        agencyId: true,
        assignedClients: true,
      },
    });

    if (!user?.role || !user.agencyId) {
      return null;
    }

    return {
      id: user.id,
      role: user.role as UserRole,
      agencyId: user.agencyId,
      assignedClientIds: parseAssignedClientIds(user.assignedClients),
    };
  } catch (error) {
    console.error('Error creating user context:', error);
    return null;
  }
}

/**
 * Get clients with automatic access filtering (optimized)
 */
export async function getAccessibleClients(
  userContext: UserContext,
  options: {
    search?: string;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}
) {
  const { search, page = 1, limit = 10, includeInactive = false } = options;

  // Use optimized query builder for user's accessible clients
  const cacheKey = `accessible-clients:${userContext.id}:${JSON.stringify(options)}`;
  const cached = clientDataCache.get(cacheKey);
  if (cached) return cached;

  // Get base accessible clients using optimized query
  let accessibleClients = await clientQueryBuilder.getUserAccessibleClients(userContext.id);

  // Apply filters
  if (!includeInactive) {
    accessibleClients = accessibleClients.filter(client => client.isActive);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    accessibleClients = accessibleClients.filter(client => 
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  }

  // Apply pagination
  const skip = (page - 1) * limit;
  const paginatedClients = accessibleClients.slice(skip, skip + limit);

  // Get counts for each client using optimized queries
  const clientsWithCounts = await Promise.all(
    paginatedClients.map(async (client) => {
      const stats = await clientQueryBuilder.getClientStats(client.id);
      return {
        ...client,
        _count: {
          campaigns: stats[0]?.totalCampaigns || 0,
          jobs: stats[0]?.totalJobs || 0,
        },
      };
    })
  );

  const result = {
    clients: clientsWithCounts,
    pagination: {
      page,
      limit,
      total: accessibleClients.length,
      pages: Math.ceil(accessibleClients.length / limit),
    },
  };

  // Cache for 5 minutes
  clientDataCache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

/**
 * Get campaigns with automatic client filtering (optimized)
 */
export async function getAccessibleCampaigns(
  userContext: UserContext,
  options: {
    clientId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { clientId, search, status, page = 1, limit = 10 } = options;

  // Apply client filtering and validation
  if (clientId) {
    // Validate access to specific client
    if (!validateClientAccessSync(userContext.role, userContext.assignedClientIds, clientId)) {
      throw new ClientAccessError(userContext.id, clientId);
    }
    
    // Set global context for middleware
    setGlobalClientContext(clientId);
    
    // Use optimized query builder for single client
    const campaigns = await clientQueryBuilder.getCampaignsForClient(clientId, {
      limit,
      offset: (page - 1) * limit,
      status,
      includeJobs: true
    });

    // Apply search filter if needed (post-query for cached results)
    let filteredCampaigns = campaigns;
    if (search) {
      filteredCampaigns = campaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return {
      campaigns: filteredCampaigns,
      pagination: {
        page,
        limit,
        total: filteredCampaigns.length,
        pages: Math.ceil(filteredCampaigns.length / limit),
      },
    };
  }

  // Fallback to original query for multi-client scenarios
  const skip = (page - 1) * limit;
  let where: any = {
    agencyId: userContext.agencyId,
  };

  if (userContext.role === UserRole.COLLABORATOR) {
    where.clientId = { in: userContext.assignedClientIds };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  // Use optimized Prisma client
  const optimizedPrisma = getOptimizedPrisma();
  const [campaigns, total] = await Promise.all([
    optimizedPrisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            brandColors: true,
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    }),
    optimizedPrisma.campaign.count({ where }),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get content jobs with automatic client filtering (optimized)
 */
export async function getAccessibleContentJobs(
  userContext: UserContext,
  options: {
    clientId?: string;
    campaignId?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { clientId, campaignId, type, status, page = 1, limit = 10 } = options;

  // Apply client filtering and validation
  if (clientId) {
    // Validate access to specific client
    if (!validateClientAccessSync(userContext.role, userContext.assignedClientIds, clientId)) {
      throw new ClientAccessError(userContext.id, clientId);
    }
    
    // Set global context for middleware
    setGlobalClientContext(clientId);
    
    // Use optimized query builder for single client
    const jobs = await clientQueryBuilder.getContentJobsForClient(clientId, {
      limit,
      offset: (page - 1) * limit,
      status,
      type,
      campaignId
    });

    return {
      jobs,
      pagination: {
        page,
        limit,
        total: jobs.length,
        pages: Math.ceil(jobs.length / limit),
      },
    };
  }

  // Fallback to original query for multi-client scenarios
  const skip = (page - 1) * limit;
  let where: any = {
    agencyId: userContext.agencyId,
  };

  if (userContext.role === UserRole.COLLABORATOR) {
    where.clientId = { in: userContext.assignedClientIds };
  }

  if (campaignId) {
    where.campaignId = campaignId;
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  // Use optimized Prisma client
  const optimizedPrisma = getOptimizedPrisma();
  const [jobs, total] = await Promise.all([
    optimizedPrisma.contentJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    optimizedPrisma.contentJob.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single client with access validation
 */
export async function getAccessibleClient(
  userContext: UserContext,
  clientId: string
) {
  // Validate access
  if (!validateClientAccessSync(userContext.role, userContext.assignedClientIds, clientId)) {
    throw new ClientAccessError(userContext.id, clientId);
  }

  const client = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: userContext.agencyId,
    },
    include: {
      _count: {
        select: {
          campaigns: true,
          jobs: true,
        },
      },
    },
  });

  if (!client) {
    throw new ClientAccessError(userContext.id, clientId, 'Client not found');
  }

  return client;
}

/**
 * Get a single campaign with access validation
 */
export async function getAccessibleCampaign(
  userContext: UserContext,
  campaignId: string
) {
  const campaign = await db.campaign.findFirst({
    where: {
      id: campaignId,
      agencyId: userContext.agencyId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          brandColors: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new ClientAccessError(userContext.id, campaignId, 'Campaign not found');
  }

  // Validate client access
  if (!validateClientAccessSync(userContext.role, userContext.assignedClientIds, campaign.clientId)) {
    throw new ClientAccessError(userContext.id, campaign.clientId);
  }

  return campaign;
}

/**
 * Create a new client (with access validation)
 */
export async function createClientWithValidation(
  userContext: UserContext,
  clientData: {
    name: string;
    email?: string;
    brandColors?: string[];
    logoUrl?: string;
    themeSettings?: any;
    workspaceSettings?: any;
    isActive?: boolean;
  }
) {
  // Only owners and managers can create clients
  if (userContext.role === UserRole.COLLABORATOR) {
    throw new ClientAccessError(userContext.id, 'new', 'Insufficient permissions to create clients');
  }

  const client = await db.client.create({
    data: {
      ...clientData,
      agencyId: userContext.agencyId,
      brandColors: JSON.stringify(clientData.brandColors || ['#3b82f6']),
      themeSettings: clientData.themeSettings ? JSON.stringify(clientData.themeSettings) : null,
      workspaceSettings: clientData.workspaceSettings ? JSON.stringify(clientData.workspaceSettings) : null,
    },
  });

  return client;
}

/**
 * Update a client (with access validation)
 */
export async function updateClientWithValidation(
  userContext: UserContext,
  clientId: string,
  updateData: {
    name?: string;
    email?: string;
    brandColors?: string[];
    logoUrl?: string;
    themeSettings?: any;
    workspaceSettings?: any;
    isActive?: boolean;
  }
) {
  // Validate access
  if (!validateClientAccessSync(userContext.role, userContext.assignedClientIds, clientId)) {
    throw new ClientAccessError(userContext.id, clientId);
  }

  // Prepare update data
  const data: any = { ...updateData };
  if (updateData.brandColors) {
    data.brandColors = JSON.stringify(updateData.brandColors);
  }
  if (updateData.themeSettings) {
    data.themeSettings = JSON.stringify(updateData.themeSettings);
  }
  if (updateData.workspaceSettings) {
    data.workspaceSettings = JSON.stringify(updateData.workspaceSettings);
  }

  const client = await db.client.update({
    where: {
      id: clientId,
      agencyId: userContext.agencyId,
    },
    data,
  });

  return client;
}

/**
 * Delete a client (with access validation)
 */
export async function deleteClientWithValidation(
  userContext: UserContext,
  clientId: string
) {
  // Only owners can delete clients
  if (userContext.role !== UserRole.OWNER) {
    throw new ClientAccessError(userContext.id, clientId, 'Insufficient permissions to delete clients');
  }

  // Validate client exists and belongs to agency
  const client = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: userContext.agencyId,
    },
  });

  if (!client) {
    throw new ClientAccessError(userContext.id, clientId, 'Client not found');
  }

  // Delete client (this will cascade to related records)
  await db.client.delete({
    where: { id: clientId },
  });

  return client;
}

/**
 * Get analytics data with client filtering
 */
export async function getClientAnalytics(
  userContext: UserContext,
  options: {
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { clientId, startDate, endDate } = options;

  // Build date filter
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  // Build client filter
  let clientFilter: any = {};
  if (clientId) {
    // Validate access to specific client
    if (!validateClientAccessSync(userContext.role, userContext.assignedClientIds, clientId)) {
      throw new ClientAccessError(userContext.id, clientId);
    }
    clientFilter.clientId = clientId;
  } else if (userContext.role === UserRole.COLLABORATOR) {
    // Filter to assigned clients only
    clientFilter.clientId = { in: userContext.assignedClientIds };
  }

  // Get analytics data
  const [
    totalCampaigns,
    activeCampaigns,
    totalJobs,
    completedJobs,
    tokensConsumed,
  ] = await Promise.all([
    db.campaign.count({
      where: {
        agencyId: userContext.agencyId,
        ...clientFilter,
        ...dateFilter,
      },
    }),
    db.campaign.count({
      where: {
        agencyId: userContext.agencyId,
        status: 'ACTIVE',
        ...clientFilter,
        ...dateFilter,
      },
    }),
    db.contentJob.count({
      where: {
        agencyId: userContext.agencyId,
        ...clientFilter,
        ...dateFilter,
      },
    }),
    db.contentJob.count({
      where: {
        agencyId: userContext.agencyId,
        status: 'COMPLETED',
        ...clientFilter,
        ...dateFilter,
      },
    }),
    db.contentJob.aggregate({
      where: {
        agencyId: userContext.agencyId,
        ...clientFilter,
        ...dateFilter,
      },
      _sum: {
        tokensConsumed: true,
      },
    }),
  ]);

  return {
    campaigns: {
      total: totalCampaigns,
      active: activeCampaigns,
    },
    jobs: {
      total: totalJobs,
      completed: completedJobs,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
    },
    tokens: {
      consumed: tokensConsumed._sum.tokensConsumed || 0,
    },
  };
}