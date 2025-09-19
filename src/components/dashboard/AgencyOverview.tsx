'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp, 
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  agency: {
    name: string;
    subscriptionPlan: string;
    tokenBalance: number;
    userCount: number;
    clientCount: number;
  };
  campaigns: {
    active: number;
    completed: number;
    totalPosts: number;
    publishedPosts: number;
  };
  contentGeneration: {
    jobsThisMonth: number;
    tokensConsumedThisMonth: number;
    successRate: number;
    averageCompletionTime: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
  upcomingPosts: Array<{
    id: string;
    campaignName: string;
    clientName: string;
    scheduledDate: string;
    status: string;
  }>;
}

export default function AgencyOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/overview');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardStats} className="mt-4"> <span>Retry</span></Button>
      </div>
    );
  }

  const tokenUsagePercentage = stats.agency.tokenBalance > 0 ? 
    Math.min((stats.contentGeneration.tokensConsumedThisMonth / stats.agency.tokenBalance) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with {stats.agency.name} today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {stats.agency.subscriptionPlan.toLowerCase()} Plan
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaigns.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.campaigns.completed} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agency.clientCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.agency.userCount} team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contentGeneration.jobsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {stats.contentGeneration.successRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agency.tokenBalance.toLocaleString()}</div>
            <Progress value={100 - tokenUsagePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.contentGeneration.tokensConsumedThisMonth.toLocaleString()} used this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publishing Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Publishing Pipeline
              <Link href="/dashboard/campaigns">
                <Button variant="outline" size="sm"> <span>View All</span><ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription> <span>Content scheduled for publication</span></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingPosts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{post.campaignName}</p>
                    <p className="text-sm text-muted-foreground">{post.clientName}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={post.status === 'approved' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(post.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {stats.upcomingPosts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming posts scheduled</p>
                  <Link href="/dashboard/campaigns">
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" /> <span>Create Campaign</span></Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across your agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'content_generated' && (
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    )}
                    {activity.type === 'campaign_created' && (
                      <Plus className="h-4 w-4 text-info-600" />
                    )}
                    {activity.type === 'post_published' && (
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                    )}
                    {activity.type === 'user_invited' && (
                      <Users className="h-4 w-4 text-orange-500" />
                    )}
                    {!['content_generated', 'campaign_created', 'post_published', 'user_invited'].includes(activity.type) && (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {activity.user && (
                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key metrics and recommendations for your agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {stats.contentGeneration.successRate}%
              </div>
              <p className="text-sm text-muted-foreground">Content Success Rate</p>
              <p className="text-xs text-muted-foreground mt-1">
                Above industry average
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-info-600">
                {Math.round(stats.contentGeneration.averageCompletionTime / 60)}m
              </div>
              <p className="text-sm text-muted-foreground">Avg. Generation Time</p>
              <p className="text-xs text-muted-foreground mt-1">
                Faster than last month
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((stats.campaigns.publishedPosts / stats.campaigns.totalPosts) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Publication Rate</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.campaigns.publishedPosts} of {stats.campaigns.totalPosts} posts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/campaigns/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> <span>New Campaign</span></Button>
            </Link>
            
            <Link href="/dashboard/clients/new">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" /> <span>Add Client</span></Button>
            </Link>
            
            <Link href="/dashboard/content/generate">
              <Button variant="outline" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" /> <span>Generate Content</span></Button>
            </Link>
            
            <Link href="/dashboard/team">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" /> <span>Invite Team</span></Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}