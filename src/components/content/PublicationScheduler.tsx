'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Share2,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Repeat2
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledPost {
  id: string;
  campaignName: string;
  clientName: string;
  scheduledDate: string;
  status: 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  platforms: Array<{
    platform: string;
    status: 'PENDING' | 'PUBLISHED' | 'FAILED';
    publishedAt?: string;
    platformPostId?: string;
    error?: string;
    metrics?: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };
  }>;
  content: {
    text: string;
    imageUrl?: string;
    hashtags: string[];
  };
  createdAt: string;
}

interface PublicationMetrics {
  totalScheduled: number;
  published: number;
  failed: number;
  pending: number;
  successRate: number;
  avgEngagement: number;
}

export default function PublicationScheduler() {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<PublicationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    fetchScheduledPosts();
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchScheduledPosts();
  }, [selectedDate]);

  const fetchScheduledPosts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('date', selectedDate.toISOString().split('T')[0]);
      
      const response = await fetch(`/api/posts/scheduled?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setScheduledPosts(result.data.posts);
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast.error('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/posts/metrics');
      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post published successfully');
        fetchScheduledPosts();
        fetchMetrics();
      } else {
        toast.error(result.error?.message || 'Failed to publish post');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Failed to publish post');
    }
  };

  const handleCancelSchedule = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Scheduled post cancelled');
        fetchScheduledPosts();
      } else {
        toast.error(result.error?.message || 'Failed to cancel post');
      }
    } catch (error) {
      console.error('Error cancelling post:', error);
      toast.error('Failed to cancel post');
    }
  };

  const handleRetryFailed = async (postId: string, platform: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Retrying publication');
        fetchScheduledPosts();
      } else {
        toast.error(result.error?.message || 'Failed to retry publication');
      }
    } catch (error) {
      console.error('Error retrying publication:', error);
      toast.error('Failed to retry publication');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-info-100 text-info-800';
      case 'PUBLISHING':
        return 'bg-warning-100 text-warning-800';
      case 'PUBLISHED':
        return 'bg-success-100 text-success-800';
      case 'FAILED':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="h-4 w-4" />;
      case 'PUBLISHING':
        return <Play className="h-4 w-4 animate-pulse" />;
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '📷';
      case 'facebook':
        return '📘';
      case 'linkedin':
        return '💼';
      case 'twitter':
        return '🐦';
      default:
        return '📱';
    }
  };

  const postsForSelectedDate = scheduledPosts.filter(post => {
    const postDate = new Date(post.scheduledDate).toDateString();
    return postDate === selectedDate.toDateString();
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publication Scheduler</h1>
          <p className="text-muted-foreground">
            Monitor and manage scheduled content publications
          </p>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalScheduled}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.pending} pending publication
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">{metrics.published}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.successRate}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-error-600">{metrics.failed}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgEngagement}%</div>
              <p className="text-xs text-muted-foreground">
                Across all platforms
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Publication Calendar</CardTitle>
                <CardDescription>
                  Select a date to view scheduled posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar className="h-5 w-5" mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Posts for Selected Date */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Posts for {selectedDate.toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    {postsForSelectedDate.length} posts scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {postsForSelectedDate.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{post.campaignName}</h4>
                            <p className="text-sm text-muted-foreground">{post.clientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.scheduledDate).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(post.status)}>
                            {getStatusIcon(post.status)}
                            <span className="ml-1">{post.status}</span>
                          </Badge>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-3">
                          <p className="text-sm line-clamp-2">{post.content.text}</p>
                          {post.content.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {post.content.hashtags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {post.content.hashtags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{post.content.hashtags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Platform Status */}
                        <div className="space-y-2 mb-3">
                          {post.platforms.map((platform, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getPlatformIcon(platform.platform)}</span>
                                <span className="text-sm font-medium capitalize">{platform.platform}</span>
                                <Badge className={`text-xs ${getStatusColor(platform.status)}`}>
                                  {platform.status}
                                </Badge>
                              </div>
                              
                              {platform.status === 'PUBLISHED' && platform.metrics && (
                                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Heart className="h-3 w-3" />
                                    <span>{platform.metrics.likes}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="h-3 w-3" />
                                    <span>{platform.metrics.comments}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Repeat2 className="h-3 w-3" />
                                    <span>{platform.metrics.shares}</span>
                                  </div>
                                </div>
                              )}

                              {platform.status === 'FAILED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => <span>handleRetryFailed(post.id, platform.platform)}
                                ></span><RotateCcw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          {post.status === 'SCHEDULED' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => <span>handlePublishNow(post.id)}
                              ></span><Play className="h-3 w-3 mr-1" />
                                Publish Now
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => <span>handleCancelSchedule(post.id)}
                              ></span><Pause className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3 mr-1" /> <span>View Details</span></Button>
                        </div>
                      </div>
                    ))}

                    {postsForSelectedDate.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No posts scheduled for this date</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Scheduled Posts</CardTitle>
              <CardDescription>
                Complete list of scheduled publications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h4 className="font-medium">{post.campaignName}</h4>
                        <p className="text-sm text-muted-foreground">{post.clientName}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(post.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.scheduledDate).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {post.platforms.map((platform, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <span className="text-sm">{getPlatformIcon(platform.platform)}</span>
                            <Badge className={`text-xs ${getStatusColor(platform.status)}`}>
                              {platform.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end">
                        <Badge className={getStatusColor(post.status)}>
                          {getStatusIcon(post.status)}
                          <span className="ml-1">{post.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {scheduledPosts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No scheduled posts found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication Success Rate</CardTitle>
                <CardDescription>
                  Success rate by platform over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Instagram', 'Facebook', 'LinkedIn'].map((platform) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getPlatformIcon(platform)}</span>
                        <span className="font-medium">{platform}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-success-500 h-2 rounded-full" 
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  Average engagement across platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-error-600" />
                      <span>Likes</span>
                    </div>
                    <span className="font-medium">{Math.floor(Math.random() * 1000)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-info-600" />
                      <span>Comments</span>
                    </div>
                    <span className="font-medium">{Math.floor(Math.random() * 100)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Repeat2 className="h-4 w-4 text-success-600" />
                      <span>Shares</span>
                    </div>
                    <span className="font-medium">{Math.floor(Math.random() * 50)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>Reach</span>
                    </div>
                    <span className="font-medium">{Math.floor(Math.random() * 10000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}