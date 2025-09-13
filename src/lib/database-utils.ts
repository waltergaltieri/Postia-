// Database utility functions
import { db } from './db';
import type { PaginationParams, PaginatedResponse } from '../types/database';

/**
 * Generic pagination utility
 */
export async function paginate<T>(
  model: any,
  params: PaginationParams & { where?: any; include?: any; orderBy?: any }
): Promise<PaginatedResponse<T>> {
  const { page, limit, where, include, orderBy } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      orderBy,
      skip,
      take: limit,
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Check if user has access to a client
 */
export async function userHasClientAccess(
  userId: string,
  clientId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      assignedClients: {
        where: { id: clientId },
      },
    },
  });

  if (!user) return false;

  // Owners and Managers have access to all clients in their agency
  if (user.role === 'OWNER' || user.role === 'MANAGER') {
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: user.agencyId,
      },
    });
    return !!client;
  }

  // Collaborators only have access to assigned clients
  return user.assignedClients.length > 0;
}

/**
 * Check if user belongs to the same agency as a resource
 */
export async function userHasAgencyAccess(
  userId: string,
  resourceAgencyId: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { agencyId: true },
  });

  return user?.agencyId === resourceAgencyId;
}

/**
 * Get user's accessible clients
 */
export async function getUserAccessibleClients(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      assignedClients: true,
    },
  });

  if (!user) return [];

  // Owners and Managers can access all clients in their agency
  if (user.role === 'OWNER' || user.role === 'MANAGER') {
    return await db.client.findMany({
      where: { agencyId: user.agencyId },
      include: {
        brandAssets: true,
        campaigns: {
          include: {
            posts: true,
          },
        },
        socialAccounts: true,
      },
    });
  }

  // Collaborators only get their assigned clients
  return user.assignedClients;
}

/**
 * Calculate token consumption for AI operations
 */
export const TOKEN_COSTS = {
  IDEA: 1,
  COPY_DESIGN: 1,
  COPY_PUBLICATION: 1,
  BASE_IMAGE: 3,
  FINAL_DESIGN: 2,
} as const;

export function calculateTokenCost(
  steps: (keyof typeof TOKEN_COSTS)[]
): number {
  return steps.reduce((total, step) => total + TOKEN_COSTS[step], 0);
}

/**
 * Check if agency has sufficient tokens
 */
export async function checkTokenBalance(
  agencyId: string,
  requiredTokens: number
): Promise<boolean> {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { tokenBalance: true },
  });

  return (agency?.tokenBalance ?? 0) >= requiredTokens;
}

/**
 * Consume tokens from agency balance
 */
export async function consumeTokens(
  agencyId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<void> {
  await db.$transaction(async (tx) => {
    // Update agency balance
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        tokenBalance: {
          decrement: amount,
        },
      },
    });

    // Record transaction
    await tx.tokenTransaction.create({
      data: {
        agencyId,
        amount: -amount,
        description,
        reference,
      },
    });
  });
}

/**
 * Add tokens to agency balance
 */
export async function addTokens(
  agencyId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<void> {
  await db.$transaction(async (tx) => {
    // Update agency balance
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        tokenBalance: {
          increment: amount,
        },
      },
    });

    // Record transaction
    await tx.tokenTransaction.create({
      data: {
        agencyId,
        amount,
        description,
        reference,
      },
    });
  });
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  agencyId: string,
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await db.auditLog.create({
    data: {
      agencyId,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Soft delete utility (for future use)
 */
export async function softDelete(
  model: any,
  id: string,
  userId: string,
  agencyId: string
): Promise<void> {
  await db.$transaction(async (tx) => {
    await model.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    await createAuditLog(
      agencyId,
      userId,
      'DELETE',
      model.name.toUpperCase(),
      id
    );
  });
}

/**
 * Generate unique slug for campaigns, clients, etc.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
