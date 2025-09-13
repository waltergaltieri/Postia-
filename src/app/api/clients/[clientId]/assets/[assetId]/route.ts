import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canPerformClientAction } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string; assetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { clientId, assetId } = params;

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
        { error: { message: 'Access denied to delete assets for this client' } },
        { status: 403 }
      );
    }

    // Check if asset exists and belongs to the client
    const asset = await db.brandAsset.findFirst({
      where: {
        id: assetId,
        clientId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: { message: 'Brand asset not found' } },
        { status: 404 }
      );
    }

    // Delete asset
    await db.brandAsset.delete({
      where: { id: assetId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        action: 'DELETE',
        resource: 'BRAND_ASSET',
        resourceId: assetId,
        details: {
          clientId,
          fileName: asset.fileName,
          assetType: asset.assetType,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Brand asset deleted successfully' },
    });
  } catch (error) {
    console.error('Delete brand asset error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to delete brand asset' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string; assetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { clientId, assetId } = params;

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
        { error: { message: 'Access denied to update assets for this client' } },
        { status: 403 }
      );
    }

    const { description } = await request.json();

    // Check if asset exists and belongs to the client
    const existingAsset = await db.brandAsset.findFirst({
      where: {
        id: assetId,
        clientId,
        client: {
          agencyId: session.user.agencyId,
        },
      },
    });

    if (!existingAsset) {
      return NextResponse.json(
        { error: { message: 'Brand asset not found' } },
        { status: 404 }
      );
    }

    // Update asset
    const updatedAsset = await db.brandAsset.update({
      where: { id: assetId },
      data: { description },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
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
        resource: 'BRAND_ASSET',
        resourceId: assetId,
        details: {
          clientId,
          fileName: updatedAsset.fileName,
          updatedFields: ['description'],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { asset: updatedAsset },
    });
  } catch (error) {
    console.error('Update brand asset error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to update brand asset' 
        } 
      },
      { status: 500 }
    );
  }
}