import { db } from '@/lib/db';
import { log } from '@/lib/logging/logger';

export enum AuditAction {
  // Authentication & Authorization
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_INVITED = 'USER_INVITED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  
  // Agency Management
  AGENCY_CREATED = 'AGENCY_CREATED',
  AGENCY_UPDATED = 'AGENCY_UPDATED',
  AGENCY_SETTINGS_CHANGED = 'AGENCY_SETTINGS_CHANGED',
  
  // Client Management
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_DELETED = 'CLIENT_DELETED',
  CLIENT_ASSIGNED = 'CLIENT_ASSIGNED',
  CLIENT_UNASSIGNED = 'CLIENT_UNASSIGNED',
  
  // Campaign Management
  CAMPAIGN_CREATED = 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED = 'CAMPAIGN_UPDATED',
  CAMPAIGN_DELETED = 'CAMPAIGN_DELETED',
  CAMPAIGN_STATUS_CHANGED = 'CAMPAIGN_STATUS_CHANGED',
  
  // Content Management
  CONTENT_GENERATED = 'CONTENT_GENERATED',
  CONTENT_REGENERATED = 'CONTENT_REGENERATED',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  CONTENT_PUBLISHED = 'CONTENT_PUBLISHED',
  CONTENT_DELETED = 'CONTENT_DELETED',
  
  // Social Media
  SOCIAL_ACCOUNT_CONNECTED = 'SOCIAL_ACCOUNT_CONNECTED',
  SOCIAL_ACCOUNT_DISCONNECTED = 'SOCIAL_ACCOUNT_DISCONNECTED',
  SOCIAL_POST_PUBLISHED = 'SOCIAL_POST_PUBLISHED',
  SOCIAL_POST_FAILED = 'SOCIAL_POST_FAILED',
  
  // Token & Billing
  TOKENS_PURCHASED = 'TOKENS_PURCHASED',
  TOKENS_CONSUMED = 'TOKENS_CONSUMED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  
  // API Management
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_UPDATED = 'API_KEY_UPDATED',
  API_KEY_DELETED = 'API_KEY_DELETED',
  API_KEY_USED = 'API_KEY_USED',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // System Events
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum AuditResource {
  USER = 'USER',
  AGENCY = 'AGENCY',
  CLIENT = 'CLIENT',
  CAMPAIGN = 'CAMPAIGN',
  POST = 'POST',
  CONTENT_JOB = 'CONTENT_JOB',
  SOCIAL_ACCOUNT = 'SOCIAL_ACCOUNT',
  TOKEN_TRANSACTION = 'TOKEN_TRANSACTION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  API_KEY = 'API_KEY',
  SYSTEM = 'SYSTEM',
}

export interface AuditContext {
  userId?: string;
  agencyId: string;
  clientId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  apiKeyId?: string;
  [key: string]: any;
}

export interface AuditEntry {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  context: AuditContext;
  timestamp?: Date;
}

export class AuditTrailService {
  /**
   * Log an audit event
   */
  static async log(entry: AuditEntry): Promise<void> {
    try {
      const auditLog = await db.auditLog.create({
        data: {
          agencyId: entry.context.agencyId,
          userId: entry.context.userId || null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId || null,
          details: entry.details || null,
          ipAddress: entry.context.ipAddress || null,
          userAgent: entry.context.userAgent || null,
        },
      });

      // Also log to structured logging system
      log.userAction(entry.action, entry.context.userId || 'system', {
        agencyId: entry.context.agencyId,
        clientId: entry.context.clientId,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        auditLogId: auditLog.id,
      });

    } catch (error) {
      // Log audit failures to system log
      log.error('Failed to create audit log entry', {
        action: entry.action,
        resource: entry.resource,
        agencyId: entry.context.agencyId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.LOGIN_FAILED,
    userId: string,
    agencyId: string,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.USER,
      resourceId: userId,
      context: { ...context, userId, agencyId },
    });
  }

  /**
   * Log user management events
   */
  static async logUserManagement(
    action: AuditAction,
    targetUserId: string,
    agencyId: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.USER,
      resourceId: targetUserId,
      details,
      context: { ...context, userId: performedBy, agencyId },
    });
  }

  /**
   * Log client management events
   */
  static async logClientManagement(
    action: AuditAction,
    clientId: string,
    agencyId: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.CLIENT,
      resourceId: clientId,
      details,
      context: { ...context, userId: performedBy, agencyId, clientId },
    });
  }

  /**
   * Log campaign management events
   */
  static async logCampaignManagement(
    action: AuditAction,
    campaignId: string,
    agencyId: string,
    clientId?: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.CAMPAIGN,
      resourceId: campaignId,
      details,
      context: { ...context, userId: performedBy, agencyId, clientId },
    });
  }

  /**
   * Log content generation events
   */
  static async logContentGeneration(
    action: AuditAction,
    jobId: string,
    agencyId: string,
    clientId?: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.CONTENT_JOB,
      resourceId: jobId,
      details,
      context: { ...context, userId: performedBy, agencyId, clientId },
    });
  }

  /**
   * Log social media events
   */
  static async logSocialMedia(
    action: AuditAction,
    accountId: string,
    agencyId: string,
    clientId?: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.SOCIAL_ACCOUNT,
      resourceId: accountId,
      details,
      context: { ...context, userId: performedBy, agencyId, clientId },
    });
  }

  /**
   * Log token and billing events
   */
  static async logTokenTransaction(
    action: AuditAction,
    transactionId: string,
    agencyId: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.TOKEN_TRANSACTION,
      resourceId: transactionId,
      details,
      context: { ...context, userId: performedBy, agencyId },
    });
  }

  /**
   * Log API key events
   */
  static async logApiKey(
    action: AuditAction,
    apiKeyId: string,
    agencyId: string,
    clientId?: string,
    performedBy?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.API_KEY,
      resourceId: apiKeyId,
      details,
      context: { ...context, userId: performedBy, agencyId, clientId },
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: AuditAction,
    agencyId: string,
    userId?: string,
    details?: Record<string, any>,
    context: Partial<AuditContext> = {}
  ): Promise<void> {
    await this.log({
      action,
      resource: AuditResource.SYSTEM,
      details,
      context: { ...context, userId, agencyId },
    });

    // Also log as security event in structured logging
    log.securityEvent(action, {
      agencyId,
      userId,
      details,
      ...context,
    });
  }

  /**
   * Get audit trail for a resource
   */
  static async getAuditTrail(
    agencyId: string,
    resource?: AuditResource,
    resourceId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const where: any = { agencyId };
    
    if (resource) {
      where.resource = resource;
    }
    
    if (resourceId) {
      where.resourceId = resourceId;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    agencyId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { agencyId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalEvents,
      eventsByAction,
      eventsByResource,
      eventsByUser,
    ] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
      }),
      db.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: true,
        orderBy: { _count: { resource: 'desc' } },
      }),
      db.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      eventsByAction: eventsByAction.map(item => ({
        action: item.action,
        count: item._count,
      })),
      eventsByResource: eventsByResource.map(item => ({
        resource: item.resource,
        count: item._count,
      })),
      eventsByUser: eventsByUser.map(item => ({
        userId: item.userId,
        count: item._count,
      })),
    };
  }

  /**
   * Clean up old audit logs (for data retention)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    log.systemEvent('AUDIT_LOGS_CLEANED', {
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays,
    });

    return result.count;
  }
}