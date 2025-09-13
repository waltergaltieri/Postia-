import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { ApiKeyService } from '@/lib/services/api-keys';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string; keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_CLIENTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to view API keys' } },
        { status: 403 }
      );
    }

    const { clientId, keyId } = params;

    // Verify client belongs to user's agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Get API key details
    const apiKey = await ApiKeyService.getApiKeyById(keyId);
    
    if (!apiKey || apiKey.clientId !== clientId) {
      return NextResponse.json(
        { error: { message: 'API key not found' } },
        { status: 404 }
      );
    }

    // Get usage statistics
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const usage = await ApiKeyService.getUsageStats(keyId, startDate);

    // Get recent usage logs
    const recentUsage = await db.apiKeyUsage.findMany({
      where: {
        apiKeyId: keyId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        tokensConsumed: true,
        ipAddress: true,
        responseTime: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey,
        usage,
        recentUsage,
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Get API key details error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch API key details' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string; keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_CLIENTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to update API keys' } },
        { status: 403 }
      );
    }

    const { clientId, keyId } = params;
    const { name, permissions, isActive, expiresAt } = await request.json();

    // Verify client belongs to user's agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Verify API key exists and belongs to client
    const existingKey = await db.apiKey.findFirst({
      where: {
        id: keyId,
        clientId,
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: { message: 'API key not found' } },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: { message: 'API key name must be a non-empty string' } },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (permissions !== undefined) {
      const validPermissions = [
        'content:generate',
        'content:read',
        'client:read',
        'jobs:read',
        '*'
      ];

      const invalidPermissions = permissions.filter((perm: string) => !validPermissions.includes(perm));
      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { error: { message: `Invalid permissions: ${invalidPermissions.join(', ')}` } },
          { status: 400 }
        );
      }
      updateData.permissions = permissions;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        updateData.expiresAt = null;
      } else {
        const expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
          return NextResponse.json(
            { error: { message: 'Expiration date must be a valid future date or null' } },
            { status: 400 }
          );
        }
        updateData.expiresAt = expirationDate;
      }
    }

    // Update API key
    const updatedKey = await db.apiKey.update({
      where: { id: keyId },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'API_KEY',
        resourceId: keyId,
        details: {
          clientId,
          changes: updateData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          id: updatedKey.id,
          name: updatedKey.name,
          keyPrefix: updatedKey.keyPrefix,
          permissions: updatedKey.permissions,
          isActive: updatedKey.isActive,
          expiresAt: updatedKey.expiresAt,
          createdAt: updatedKey.createdAt,
          updatedAt: updatedKey.updatedAt,
        },
        message: 'API key updated successfully',
      },
    });
  } catch (error) {
    console.error('Update API key error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to update API key' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string; keyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.MANAGE_CLIENTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to delete API keys' } },
        { status: 403 }
      );
    }

    const { clientId, keyId } = params;

    // Verify client belongs to user's agency
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Verify API key exists and belongs to client
    const existingKey = await db.apiKey.findFirst({
      where: {
        id: keyId,
        clientId,
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: { message: 'API key not found' } },
        { status: 404 }
      );
    }

    // Revoke API key (soft delete by setting isActive to false)
    await ApiKeyService.revokeApiKey(keyId);

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'API_KEY',
        resourceId: keyId,
        details: {
          clientId,
          keyName: existingKey.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'API key revoked successfully',
      },
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to revoke API key' 
        } 
      },
      { status: 500 }
    );
  }
}