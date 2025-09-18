// Unified dashboard types to resolve interface inconsistencies

export interface AgencyStats {
  name: string;
  subscriptionPlan: string;
  tokenBalance: number;
  userCount: number;
  clientCount: number;
}

export interface CampaignStats {
  active: number;
  completed: number;
  totalPosts: number;
  publishedPosts: number;
}

export interface ContentGenerationStats {
  jobsThisMonth: number;
  tokensConsumedThisMonth: number;
  successRate: number;
  averageCompletionTime: number;
}

export interface ActivityItem {
  id: string;
  type: 'content_generated' | 'campaign_created' | 'post_published' | 'user_invited';
  description: string;
  timestamp: string;
  user?: string;
}

export interface UpcomingPost {
  id: string;
  campaignName: string;
  clientName: string;
  scheduledDate: string;
  status: 'SCHEDULED' | 'PENDING_APPROVAL' | 'APPROVED';
}

// Unified dashboard data structure
export interface DashboardData {
  agency: AgencyStats;
  campaigns: CampaignStats;
  contentGeneration: ContentGenerationStats;
  recentActivity: ActivityItem[];
  upcomingPosts: UpcomingPost[];
}

// Simplified stats for basic dashboard overview
export interface BasicDashboardStats {
  totalClients: number;
  activeCampaigns: number;
  tokenBalance: number;
  recentJobs: number;
}

// Props for dashboard components
export interface DashboardOverviewProps {
  agency: AgencyStats;
  stats: BasicDashboardStats;
  recentJobs: ActivityItem[];
}

// API response structure
export interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
  error?: {
    message: string;
    code?: string;
  };
}

// Validation helpers
export function validateDashboardData(data: any): data is DashboardData {
  return (
    data &&
    typeof data === 'object' &&
    data.agency &&
    typeof data.agency.name === 'string' &&
    typeof data.agency.tokenBalance === 'number' &&
    data.campaigns &&
    typeof data.campaigns.active === 'number' &&
    data.contentGeneration &&
    typeof data.contentGeneration.jobsThisMonth === 'number' &&
    Array.isArray(data.recentActivity) &&
    Array.isArray(data.upcomingPosts)
  );
}

export function transformToDashboardData(rawData: any): DashboardData {
  // Transform and validate raw API data to ensure consistency
  return {
    agency: {
      name: rawData.agency?.name || 'Unknown Agency',
      subscriptionPlan: rawData.agency?.subscriptionPlan || 'FREE',
      tokenBalance: Number(rawData.agency?.tokenBalance) || 0,
      userCount: Number(rawData.agency?.userCount) || 0,
      clientCount: Number(rawData.agency?.clientCount) || 0,
    },
    campaigns: {
      active: Number(rawData.campaigns?.active) || 0,
      completed: Number(rawData.campaigns?.completed) || 0,
      totalPosts: Number(rawData.campaigns?.totalPosts) || 0,
      publishedPosts: Number(rawData.campaigns?.publishedPosts) || 0,
    },
    contentGeneration: {
      jobsThisMonth: Number(rawData.contentGeneration?.jobsThisMonth) || 0,
      tokensConsumedThisMonth: Number(rawData.contentGeneration?.tokensConsumedThisMonth) || 0,
      successRate: Number(rawData.contentGeneration?.successRate) || 0,
      averageCompletionTime: Number(rawData.contentGeneration?.averageCompletionTime) || 0,
    },
    recentActivity: Array.isArray(rawData.recentActivity) ? rawData.recentActivity : [],
    upcomingPosts: Array.isArray(rawData.upcomingPosts) ? rawData.upcomingPosts : [],
  };
}