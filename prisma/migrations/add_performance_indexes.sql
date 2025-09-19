-- Add performance indexes for multi-tenant client filtering
-- This migration adds indexes to improve query performance for client-specific operations

-- Index for client filtering on campaigns
CREATE INDEX IF NOT EXISTS "Campaign_clientId_status_idx" ON "Campaign"("clientId", "status");
CREATE INDEX IF NOT EXISTS "Campaign_clientId_createdAt_idx" ON "Campaign"("clientId", "createdAt" DESC);

-- Index for client filtering on content jobs
CREATE INDEX IF NOT EXISTS "ContentJob_clientId_status_idx" ON "ContentJob"("clientId", "status");
CREATE INDEX IF NOT EXISTS "ContentJob_clientId_type_idx" ON "ContentJob"("clientId", "type");
CREATE INDEX IF NOT EXISTS "ContentJob_clientId_createdAt_idx" ON "ContentJob"("clientId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ContentJob_campaignId_status_idx" ON "ContentJob"("campaignId", "status");

-- Index for user client access validation
CREATE INDEX IF NOT EXISTS "User_agencyId_idx" ON "User"("agencyId");
CREATE INDEX IF NOT EXISTS "User_assignedClients_idx" ON "User"("assignedClients");
CREATE INDEX IF NOT EXISTS "User_lastSelectedClient_idx" ON "User"("lastSelectedClient");

-- Index for client sessions
CREATE INDEX IF NOT EXISTS "ClientSession_userId_lastAccessed_idx" ON "ClientSession"("userId", "lastAccessed" DESC);
CREATE INDEX IF NOT EXISTS "ClientSession_clientId_lastAccessed_idx" ON "ClientSession"("clientId", "lastAccessed" DESC);

-- Index for client management
CREATE INDEX IF NOT EXISTS "Client_agencyId_isActive_idx" ON "Client"("agencyId", "isActive");
CREATE INDEX IF NOT EXISTS "Client_agencyId_name_idx" ON "Client"("agencyId", "name");

-- Index for agency relationships
CREATE INDEX IF NOT EXISTS "Campaign_agencyId_status_idx" ON "Campaign"("agencyId", "status");
CREATE INDEX IF NOT EXISTS "ContentJob_agencyId_status_idx" ON "ContentJob"("agencyId", "status");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "Campaign_clientId_agencyId_status_idx" ON "Campaign"("clientId", "agencyId", "status");
CREATE INDEX IF NOT EXISTS "ContentJob_clientId_userId_status_idx" ON "ContentJob"("clientId", "userId", "status");

-- Index for date range queries
CREATE INDEX IF NOT EXISTS "Campaign_startDate_endDate_idx" ON "Campaign"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "ContentJob_scheduledDate_idx" ON "ContentJob"("scheduledDate");
CREATE INDEX IF NOT EXISTS "ContentJob_completedAt_idx" ON "ContentJob"("completedAt");

-- Partial indexes for active records (SQLite supports partial indexes)
CREATE INDEX IF NOT EXISTS "Client_active_agency_idx" ON "Client"("agencyId", "name") WHERE "isActive" = 1;
CREATE INDEX IF NOT EXISTS "Campaign_active_client_idx" ON "Campaign"("clientId", "createdAt" DESC) WHERE "status" = 'ACTIVE';