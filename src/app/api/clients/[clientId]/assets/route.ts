import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canPerformClientAction } from '@/lib/permissions';
import { UserRole, AssetType } from '@/generated/prisma';
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
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('type') as AssetType | null;
    const search = searchParams.get('search') || '';

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

    // Build where clause
    const where: any = {
      clientId,
    };

    if (assetType) {
      where.assetType = assetType;
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get brand assets
    const assets = await db.brandAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        assetType: true,
        description: true,
        createdAt: true,
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { assets },
    });
  } catch (error) {
    console.error('Get brand assets error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to fetch brand assets' 
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
        { error: { message: 'Access denied to upload assets for this client' } },
        { status: 403 }
      );
    }

    // Check if client exists
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

    const {
      fileName,
      fileUrl,
      fileType,
      fileSize,
      assetType,
      description,
    } = await request.json();

    // Validate required fields
    if (!fileName || !fileUrl || !fileType || !assetType) {
      return NextResponse.json(
        { error: { message: 'File name, URL, type, and asset type are required' } },
        { status: 400 }
      );
    }

    // Validate asset type
    const validAssetTypes = Object.values(AssetType);
    if (!validAssetTypes.includes(assetType)) {
      return NextResponse.json(
        { error: { message: 'Invalid asset type' } },
        { status: 400 }
      );
    }

    // Create brand asset
    const asset = await db.brandAsset.create({
      data: {
        fileName,
        fileUrl,
        fileType,
        fileSize: fileSize || 0,
        assetType,
        description,
        clientId,
        uploadedById: session.user.id,
      },
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
        action: 'CREATE',
        resource: 'BRAND_ASSET',
        resourceId: asset.id,
        details: {
          clientId,
          fileName: asset.fileName,
          assetType: asset.assetType,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { asset },
    });
  } catch (error) {
    console.error('Upload brand asset error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to upload brand asset' 
        } 
      },
      { status: 500 }
    );
  }
}