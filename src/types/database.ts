// Database-related types and interfaces
import type {
  User,
  Agency,
  Client,
  Campaign,
  Post,
  ContentGenerationJob,
  SocialAccount,
  BrandAsset,
  PublicationResult,
  UserRole,
  PostStatus,
  CampaignStatus,
  SocialPlatform,
  SubscriptionPlan,
  AssetType,
  GenerationStep,
  JobStatus,
} from '../generated/prisma';

// Extended types with relations
export interface UserWithAgency extends User {
  agency: Agency;
  assignedClients: Client[];
}

export interface AgencyWithUsers extends Agency {
  users: User[];
  clients: Client[];
}

export interface ClientWithAssets extends Client {
  brandAssets: BrandAsset[];
  campaigns: Campaign[];
  socialAccounts: SocialAccount[];
  assignedUsers: User[];
}

export interface CampaignWithPosts extends Campaign {
  client: Client;
  posts: Post[];
}

export interface PostWithRelations extends Post {
  campaign: CampaignWithClient;
  generationJob?: ContentGenerationJob;
  publicationResults: PublicationResult[];
}

export interface CampaignWithClient extends Campaign {
  client: Client;
}

// API Request/Response types
export interface CreateAgencyRequest {
  name: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
}

export interface CreateClientRequest {
  brandName: string;
  brandColors: string[];
  typography?: Record<string, any>;
  description?: string;
  logoUrl?: string;
  whatsappNumber?: string;
  socialMediaLinks?: {
    platform: string;
    url: string;
    username?: string;
  }[];
}

export interface CreateCampaignRequest {
  clientId: string;
  name: string;
  objective: string;
  startDate: Date;
  endDate: Date;
  brandTone: string;
  publicationFrequency: Record<string, any>;
  templateIds: string[];
}

export interface ContentGenerationRequest {
  campaignId: string;
  scheduledDate: Date;
  brandContext: {
    brandName: string;
    brandTone: string;
    objective: string;
    brandColors: string[];
    description?: string;
  };
}

export interface TokenPurchaseRequest {
  planId: string;
  tokenAmount: number;
}

// Utility types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Filter types
export interface ClientFilters {
  agencyId: string;
  assignedUserId?: string;
  search?: string;
}

export interface CampaignFilters {
  clientId?: string;
  status?: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface PostFilters {
  campaignId?: string;
  status?: PostStatus;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
}

// Dashboard analytics types
export interface AgencyAnalytics {
  totalClients: number;
  totalCampaigns: number;
  totalPosts: number;
  tokenBalance: number;
  tokensUsedThisMonth: number;
  postsPublishedThisMonth: number;
  activeUsers: number;
}

export interface ClientAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  approvedPosts: number;
  connectedSocialAccounts: number;
}

export interface CampaignAnalytics {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  tokensUsed: number;
  averageEngagement?: number;
}

// Export Prisma types for convenience
export type {
  User,
  Agency,
  Client,
  Campaign,
  Post,
  ContentGenerationJob,
  SocialAccount,
  BrandAsset,
  PublicationResult,
  UserRole,
  PostStatus,
  CampaignStatus,
  SocialPlatform,
  SubscriptionPlan,
  AssetType,
  GenerationStep,
  JobStatus,
} from '../generated/prisma';
