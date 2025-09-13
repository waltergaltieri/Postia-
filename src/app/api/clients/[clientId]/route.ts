import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canPerformClientAction } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
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

    const { clientId } = params;

    // Get user's assigned clients
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { assignedClients: { select: { id: true } } },
    });
    
    const assignedClientIds = user?.assignedClients.map(c => c.id) || [];

    // Check if user can access this client
    if (!canPerformClientAction(
      session.user.role as UserRole,
      assignedClientIds,
      clientId,
      'view'
    )) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }

    // Get client details
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        brandAssets: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            assetType: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            campaigns: true,
            posts: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { client },
    });
  } catch (error) {
    console.error('Get client error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch client' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { clientId } = params;

    // Get user's assigned clients
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { assignedClients: { select: { id: true } } },
    });
    
    const assignedClientIds = user?.assignedClients.map(c => c.id) || [];

    // Check if user can edit this client
    if (!canPerformClientAction(
      session.user.role as UserRole,
      assignedClientIds,
      clientId,
      'edit'
    )) {
      return NextResponse.json(
        { error: { message: 'Access denied to edit this client' } },
        { status: 403 }
      );
    }

    const {
      brandName,
      contactEmail,
      contactPhone,
      industry,
      website,
      description,
      brandColors,
      brandFonts,
      brandVoice,
      targetAudience,
      assignedUserIds,
    } = await request.json();

    // Validate email format if provided
    if (contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return NextResponse.json(
          { error: { message: 'Invalid email format' } },
          { status: 400 }
        );
      }
    }

    // Check if client exists and belongs to agency
    const existingClient = await db.client.findFirst({
      where: {
        id: clientId,
        agencyId: session.user.agencyId,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: { message: 'Client not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate brand name (excluding current client)
    if (brandName && brandName !== existingClient.brandName) {
      const duplicateClient = await db.client.findFirst({
        where: {
          agencyId: session.user.agencyId,
          brandName: { equals: brandName, mode: 'insensitive' },
          id: { not: clientId },
        },
      });

      if (duplicateClient) {
        return NextResponse.json(
          { error: { message: 'A client with this brand name already exists' } },
          { status: 409 }
        );
      }
    }

    // Validate assigned users if provided
    if (assignedUserIds && assignedUserIds.length > 0) {
      const users = await db.user.findMany({
        where: {
          id: { in: assignedUserIds },
          agencyId: session.user.agencyId,
        },
      });

      if (users.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: { message: 'Some assigned users do not exist in your agency' } },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (brandName !== undefined) updateData.brandName = brandName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (industry !== undefined) updateData.industry = industry;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;
    if (brandColors !== undefined) updateData.brandColors = brandColors;
    if (brandFonts !== undefined) updateData.brandFonts = brandFonts;
    if (brandVoice !== undefined) updateData.brandVoice = brandVoice;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;

    if (assignedUserIds !== undefined) {
      updateData.assignedUsers = {
        set: assignedUserIds.map((id: string) => ({ id })),
      };
    }

    // Update client
    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: updateData,
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'CLIENT',
        resourceId: clientId,
        details: {
          updatedFields: Object.keys(updateData),
          brandName: updatedClient.brandName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { client: updatedClient },
    });
  } catch (error) {
    console.error('Update client error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to update client' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { clientId } = params;

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.DELETE_CLIENTS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to delete clients' } },
        { status: 403 }
      );
    }

    // Check if client exists and belongs to agency
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

    // Check if client has active campaigns
    const campaignCount = await db.campaign.count({
      where: { clientId },
    });

    if (campaignCount > 0) {
      return NextResponse.json(
        { error: { message: 'Cannot delete client with active campaigns' } },
        { status: 400 }
      );
    }

    // Delete client (this will cascade delete brand assets)
    await db.client.delete({
      where: { id: clientId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'CLIENT',
        resourceId: clientId,
        details: {
          deletedClient: {
            brandName: client.brandName,
            contactEmail: client.contactEmail,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Client deleted successfully' },
    });
  } catch (error) {
    console.error('Delete client error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to delete client' 
        } 
      },
      { status: 500 }
    );
  }
}