import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { ApiKeyService } from '@/lib/services/api-keys';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
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
        { error: { message: 'Insufficient permissions to manage API keys' } },
        { status: 403 }
      );
    }

    const { clientId } = params;

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

    // Get API keys for the client
    const apiKeys = await ApiKeyService.listClientApiKeys(clientId);

    // Get usage statistics for each key
    const keysWithUsage = await Promise.all(
      apiKeys.map(async (key) => {
        const usage = await ApiKeyService.getUsageStats(key.id);
        return {
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          permissions: key.permissions,
          isActive: key.isActive,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          createdAt: key.createdAt,
          usage,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: keysWithUsage,
      },
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch API keys' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
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
        { error: { message: 'Insufficient permissions to create API keys' } },
        { status: 403 }
      );
    }

    const { clientId } = params;
    const { name, permissions = ['content:generate', 'content:read', 'client:read'], expiresAt } = await request.json();

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'API key name is required' } },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: { message: 'API key name must be less than 100 characters' } },
        { status: 400 }
      );
    }

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

    // Validate permissions
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

    // Parse expiration date if provided
    let expirationDate: Date | undefined;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        return NextResponse.json(
          { error: { message: 'Expiration date must be a valid future date' } },
          { status: 400 }
        );
      }
    }

    // Create API key
    const { apiKey, keyData } = await ApiKeyService.createApiKey(
      clientId,
      name.trim(),
      permissions,
      expirationDate
    );

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'CREATE',
        resource: 'API_KEY',
        resourceId: keyData.id,
        details: {
          clientId,
          name: keyData.name,
          permissions: keyData.permissions,
          expiresAt: keyData.expiresAt,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey, // This is the only time the full key is returned
        keyData: {
          id: keyData.id,
          name: keyData.name,
          keyPrefix: keyData.keyPrefix,
          permissions: keyData.permissions,
          isActive: keyData.isActive,
          expiresAt: keyData.expiresAt,
          createdAt: keyData.createdAt,
        },
        message: 'API key created successfully. Save this key securely - it will not be shown again.',
      },
    });
  } catch (error) {
    console.error('Create API key error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to create API key' 
        } 
      },
      { status: 500 }
    );
  }
}