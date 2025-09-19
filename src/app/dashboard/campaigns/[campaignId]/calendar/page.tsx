'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CalendarView from '@/components/campaigns/CalendarView';
import { PERMISSIONS } from '@/lib/permissions';
import { PostStatus, SocialPlatform } from '@/generated/prisma';
import Link from 'next/link';

interface Post {
  id: string;
  content: string;
  scheduledFor: string;
  status: PostStatus;
  platforms: SocialPlatform[];
  imageUrl: string | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  client: {
    id: string;
    brandName: string;
  };
}

export default function CampaignCalendarPage() {
  const params = useParams();
  const { user } = useAuth();
  const { checkPermission } = usePermissions();
  const campaignId = params.campaignId as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create post form state
  const [createForm, setCreateForm] = useState({
    content: '',
    scheduledFor: '',
    platforms: [] as string[],
    imageUrl: '',
  });

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access denied to this campaign');
          return;
        }
        throw new Error(data.error?.message || 'Failed to fetch campaign');
      }

      setCampaign(data.data.campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleDateClick = (date: string) => {
    if (checkPermission(PERMISSIONS.EDIT_ALL_CAMPAIGNS) || checkPermission(PERMISSIONS.EDIT_ASSIGNED_CAMPAIGNS)) {
      setSelectedDate(date);
      setCreateForm(prev => ({
        ...prev,
        scheduledFor: `${date}T12:00`, // Default to noon
      }));
      setShowCreateModal(true);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create post');
      }

      setSuccess('Post created successfully');
      setShowCreateModal(false);
      setCreateForm({
        content: '',
        scheduledFor: '',
        platforms: [],
        imageUrl: '',
      });
      
      // Refresh calendar by triggering a re-render
      window.location.reload();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setCreateForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT:
        return 'bg-warning-100 text-warning-800';
      case PostStatus.APPROVED:
        return 'bg-info-100 text-info-800';
      case PostStatus.PUBLISHED:
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.FACEBOOK:
        return '📘';
      case SocialPlatform.INSTAGRAM:
        return '📷';
      case SocialPlatform.LINKEDIN:
        return '💼';
      default:
        return '📱';
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-info-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/dashboard/campaigns"
              className="text-info-600 hover:text-info-800"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!campaign) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h2>
            <Link
              href="/dashboard/campaigns"
              className="text-info-600 hover:text-info-800"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <Link
                    href="/dashboard/campaigns"
                    className="text-info-600 hover:text-info-800"
                  >
                    ← Back to Campaigns
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link
                    href={`/dashboard/campaigns/${campaignId}`}
                    className="text-info-600 hover:text-info-800"
                  >
                    Campaign Details
                  </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Campaign Calendar</h1>
                <p className="mt-2 text-gray-600">
                  {campaign.name} • {campaign.client.brandName}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Calendar */}
            <CalendarView
              campaignId={campaignId}
              onPostClick={handlePostClick}
              onDateClick={handleDateClick}
            />

            {/* Post Details Modal */}
            {showPostModal && selectedPost && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Post Details
                      </h3>
                      <button
                        onClick={() => setShowPostModal(false)}
                        className="text-muted-foreground hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPost.status)}`}>
                          {selectedPost.status}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scheduled For
                        </label>
                        <p className="text-gray-900">
                          {new Date(selectedPost.scheduledFor).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platforms
                        </label>
                        <div className="flex space-x-2">
                          {selectedPost.platforms.map((platform) => (
                            <span key={platform} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                              <span>{getPlatformIcon(platform)}</span>
                              <span className="text-sm">{platform}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content
                        </label>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedPost.content}</p>
                        </div>
                      </div>

                      {selectedPost.imageUrl && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image
                          </label>
                          <img
                            src={selectedPost.imageUrl}
                            alt="Post image"
                            className="max-w-full h-auto rounded-md"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                      <button
                        onClick={() => setShowPostModal(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Close
                      </button>
                      <Link
                        href={`/dashboard/campaigns/${campaignId}/posts/${selectedPost.id}`}
                        className="px-4 py-2 bg-info-600 text-white rounded-md hover:bg-info-700"
                      > <span>Edit Post</span></Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Post Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Create New Post for {selectedDate}
                    </h3>
                    
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content *
                        </label>
                        <textarea
                          required
                          value={createForm.content}
                          onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          placeholder="Enter post content..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scheduled Date & Time *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={createForm.scheduledFor}
                          onChange={(e) => setCreateForm({ ...createForm, scheduledFor: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platforms *
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'].map((platform) => (
                            <label key={platform} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={createForm.platforms.includes(platform)}
                                onChange={() => handlePlatformToggle(platform)}
                                className="rounded border-gray-300 text-info-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{platform}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image URL (optional)
                        </label>
                        <input
                          type="url"
                          value={createForm.imageUrl}
                          onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-info-600 text-white rounded-md hover:bg-info-700"
                        >
                          Create Post
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}