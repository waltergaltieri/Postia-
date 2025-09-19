import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS, canAccessClient } from '@/lib/permissions';
import { UserRole, CampaignStatus } from '@/generated/prisma';
import { db } from '@/lib/db';
import { 
  withOptionalClientIsolation, 
  NextRequestWithClientContext,
  createClientIsolatedQueries,
  requireUserContext
} from '@/lib/middleware/client-isolation';

async function handleGET(request: NextRequestWithClientContext) {
  const userContext = requireUserContext(request);
  const clientQueries = createClientIsolatedQueries(request);
  
  if (!clientQueries) {
    return NextResponse.json(
      { error: { message: 'Failed to create client context' } },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const clientId = searchParams.get('client');
  const status = searchParams.get('status') as CampaignStatus | null;

  const skip = (page - 1) * limit;

  // Build base where clause with automatic client filtering
  let where: any = clientQueries.getClientFilter();

  // Filter by specific client if specified and user has access
  if (clientId) {
    if (!clientQueries.canAccessClient(clientId)) {
      return NextResponse.json(
        { error: { message: 'Access denied to this client' } },
        { status: 403 }
      );
    }
    where.clientId = clientId;
  }

  // Filter by status if specified
  if (status && Object.values(CampaignStatus).includes(status)) {
    where.status = status;
  }

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Get campaigns with pagination using client-isolated queries
  const [campaigns, total] = await Promise.all([
    db.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    }),
    db.campaign.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}

async function handlePOST(request: NextRequestWithClientContext) {
  const userContext = requireUserContext(request);
  const clientQueries = createClientIsolatedQueries(request);
  
  if (!clientQueries) {
    return NextResponse.json(
      { error: { message: 'Failed to create client context' } },
      { status: 500 }
    );
  }

  // Check permissions
  if (!hasPermission(userContext.role, PERMISSIONS.CREATE_CAMPAIGNS)) {
    return NextResponse.json(
      { error: { message: 'Insufficient permissions to create campaigns' } },
      { status: 403 }
    );
  }

  const {
    name,
    description,
    clientId,
    startDate,
    endDate,
    status = 'ACTIVE',
    settings,
  } = await request.json();

  // Validate required fields
  if (!name || !clientId || !startDate || !endDate) {
    return NextResponse.json(
      { error: { message: 'Name, client, start date, and end date are required' } },
      { status: 400 }
    );
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return NextResponse.json(
      { error: { message: 'End date must be after start date' } },
      { status: 400 }
    );
  }

  // Check if user can access this client
  if (!clientQueries.canAccessClient(clientId)) {
    return NextResponse.json(
      { error: { message: 'Access denied to this client' } },
      { status: 403 }
    );
  }

  // Verify client exists and belongs to the same agency
  const client = await db.client.findFirst({
    where: {
      id: clientId,
      agencyId: userContext.agencyId,
    },
  });

  if (!client) {
    return NextResponse.json(
      { error: { message: 'Client not found' } },
      { status: 404 }
    );
  }

  // Create campaign
  const campaign = await db.campaign.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      clientId,
      agencyId: userContext.agencyId,
      startDate: start,
      endDate: end,
      status,
      settings: settings ? JSON.stringify(settings) : null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      settings: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: { campaign },
  });
}

// Export handlers with client isolation middleware
export const GET = withOptionalClientIsolation(handleGET);
export const POST = withOptionalClientIsolation(handlePOST);