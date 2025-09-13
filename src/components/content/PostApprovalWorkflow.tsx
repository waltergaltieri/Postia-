'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Edit, 
  Eye,
  Calendar,
  Share2,
  RotateCcw,
  Download,
  Upload,
  AlertCircle,
  User,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  campaignId: string;
  campaignName: string;
  clientName: string;
  scheduledDate: string;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  finalImageUrl?: string;
  embeddedText?: string;
  publicationText?: string;
  hashtags: string[];
  cta?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: string;
  comments: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
    };
    createdAt: string;
  }>;
  versions: Array<{
    id: string;
    versionNumber: number;
    createdAt: string;
  }>;
}

interface ApprovalFilters {
  status: string;
  client: string;
  campaign: string;
  dateRange: string;
}

export default function PostApprovalWorkflow() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<ApprovalFilters>({
    status: '',
    client: '',
    campaign: '',
    dateRange: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [commentForm, setCommentForm] = useState({ content: '' });
  const [editForm, setEditForm] = useState({
    publicationText: '',
    hashtags: '',
    cta: '',
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    platforms: [] as string[],
  });

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.client) params.append('client', filters.client);
      if (filters.campaign) params.append('campaign', filters.campaign);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/posts/approval?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setPosts(result.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (postId: string) => {
    setActionLoading(`approve-${postId}`);
    
    try {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post approved successfully');
        fetchPosts();
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, status: 'APPROVED' });
        }
      } else {
        toast.error(result.error?.message || 'Failed to approve post');
      }
    } catch (error) {
      console.error('Error approving post:', error);
      toast.error('Failed to approve post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPost = async (postId: string, reason: string) => {
    setActionLoading(`reject-${postId}`);
    
    try {
      const response = await fetch(`/api/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post rejected');
        fetchPosts();
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, status: 'DRAFT' });
        }
      } else {
        toast.error(result.error?.message || 'Failed to reject post');
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast.error('Failed to reject post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentForm.content.trim()) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Comment added');
        setCommentForm({ content: '' });
        setShowCommentDialog(false);
        fetchPosts();
        
        if (selectedPost?.id === postId) {
          const updatedPost = await fetchPostDetails(postId);
          setSelectedPost(updatedPost);
        }
      } else {
        toast.error(result.error?.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleEditPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicationText: editForm.publicationText,
          hashtags: editForm.hashtags.split(',').map(tag => tag.trim()),
          cta: editForm.cta,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post updated successfully');
        setShowEditDialog(false);
        fetchPosts();
        
        if (selectedPost?.id === postId) {
          const updatedPost = await fetchPostDetails(postId);
          setSelectedPost(updatedPost);
        }
      } else {
        toast.error(result.error?.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleSchedulePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post scheduled successfully');
        setShowScheduleDialog(false);
        fetchPosts();
      } else {
        toast.error(result.error?.message || 'Failed to schedule post');
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post');
    }
  };

  const fetchPostDetails = async (postId: string): Promise<Post> => {
    const response = await fetch(`/api/posts/${postId}`);
    const result = await response.json();
    return result.data.post;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PUBLISHED':
        return <Share2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredPosts = posts.filter(post => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.publicationText?.toLowerCase().includes(searchLower) ||
        post.clientName.toLowerCase().includes(searchLower) ||
        post.campaignName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Content Approval</h1>
          <p className="text-muted-foreground">
            Review and approve content before publication
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div>
              <Label>Date Range</Label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchPosts} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Posts ({filteredPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPost?.id === post.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{post.campaignName}</p>
                        <p className="text-xs text-muted-foreground">{post.clientName}</p>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(post.status)}`}>
                        {getStatusIcon(post.status)}
                        <span className="ml-1">{post.status}</span>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.publicationText || 'No content text'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.scheduledDate).toLocaleDateString()}
                      </span>
                      {post.comments.length > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {post.comments.length}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredPosts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No posts found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Post Details */}
        <div className="lg:col-span-2">
          {selectedPost ? (
            <Tabs defaultValue="content" className="space-y-6">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="comments">Comments ({selectedPost.comments.length})</TabsTrigger>
                <TabsTrigger value="versions">Versions ({selectedPost.versions.length})</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Content Preview
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(selectedPost.status)}>
                          {selectedPost.status}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Image Preview */}
                    {selectedPost.finalImageUrl && (
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={selectedPost.finalImageUrl}
                          alt="Post content"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Text Content */}
                    <div>
                      <Label>Publication Text</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedPost.publicationText || 'No publication text'}
                        </p>
                      </div>
                    </div>

                    {/* Hashtags */}
                    {selectedPost.hashtags.length > 0 && (
                      <div>
                        <Label>Hashtags</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedPost.hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Call to Action */}
                    {selectedPost.cta && (
                      <div>
                        <Label>Call to Action</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedPost.cta}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label>Campaign</Label>
                        <p className="text-sm">{selectedPost.campaignName}</p>
                      </div>
                      <div>
                        <Label>Client</Label>
                        <p className="text-sm">{selectedPost.clientName}</p>
                      </div>
                      <div>
                        <Label>Scheduled Date</Label>
                        <p className="text-sm">
                          {new Date(selectedPost.scheduledDate).toLocaleString()}
                        </p>
                      </div>
                      {selectedPost.approvedBy && (
                        <div>
                          <Label>Approved By</Label>
                          <p className="text-sm">{selectedPost.approvedBy.name}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Comments & Feedback
                      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Add Comment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Comment</DialogTitle>
                            <DialogDescription>
                              Provide feedback or notes for this post
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Enter your comment..."
                              value={commentForm.content}
                              onChange={(e) => setCommentForm({ content: e.target.value })}
                              rows={4}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleAddComment(selectedPost.id)}>
                                Add Comment
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedPost.comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-sm">{comment.author.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                      
                      {selectedPost.comments.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No comments yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>
                      Track changes and revisions to this post
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPost.versions.map((version) => (
                        <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Version {version.versionNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(version.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {selectedPost.versions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No versions available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Actions</CardTitle>
                    <CardDescription>
                      Manage this post's approval status and scheduling
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Approval Actions */}
                    {selectedPost.status === 'DRAFT' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprovePost(selectedPost.id)}
                          disabled={actionLoading === `approve-${selectedPost.id}`}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Post
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectPost(selectedPost.id, 'Needs revision')}
                          disabled={actionLoading === `reject-${selectedPost.id}`}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Request Changes
                        </Button>
                      </div>
                    )}

                    {/* Edit Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Content
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Post Content</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Publication Text</Label>
                              <Textarea
                                value={editForm.publicationText}
                                onChange={(e) => setEditForm({ ...editForm, publicationText: e.target.value })}
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Hashtags (comma-separated)</Label>
                              <Input
                                value={editForm.hashtags}
                                onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value })}
                                placeholder="hashtag1, hashtag2, hashtag3"
                              />
                            </div>
                            <div>
                              <Label>Call to Action</Label>
                              <Input
                                value={editForm.cta}
                                onChange={(e) => setEditForm({ ...editForm, cta: e.target.value })}
                                placeholder="Visit our website, Sign up now..."
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleEditPost(selectedPost.id)}>
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>

                    {/* Scheduling */}
                    {selectedPost.status === 'APPROVED' && (
                      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Publication
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Publication</DialogTitle>
                            <DialogDescription>
                              Set when and where to publish this content
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Publication Date & Time</Label>
                              <Input
                                type="datetime-local"
                                value={scheduleForm.scheduledDate}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Platforms</Label>
                              <div className="space-y-2">
                                {['Instagram', 'Facebook', 'LinkedIn'].map((platform) => (
                                  <label key={platform} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={scheduleForm.platforms.includes(platform.toLowerCase())}
                                      onChange={(e) => {
                                        const platforms = e.target.checked
                                          ? [...scheduleForm.platforms, platform.toLowerCase()]
                                          : scheduleForm.platforms.filter(p => p !== platform.toLowerCase());
                                        setScheduleForm({ ...scheduleForm, platforms });
                                      }}
                                    />
                                    <span>{platform}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleSchedulePost(selectedPost.id)}>
                                Schedule Post
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Export Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a post to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}