'use client';

import { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';
import { CampaignStatus } from '@/generated/prisma';
import { useNavigation, useClientManagement } from '@/components/navigation/navigation-context';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  client: {
    id: string;
    brandName: string;
  };
  _count: {
    posts: number;
  };
}

interface Client {
  id: string;
  brandName: string;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const { checkPermission } = usePermissions();
  const { currentClient, clients } = useNavigation();
  const { selectedClientId, clientWorkspaceMode, isClientDataIsolated } = useClientManagement();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    clientId: '',
    startDate: '',
    endDate: '',
    postsPerWeek: 3,
    platforms: [] as string[],
    targetAudience: '',
    campaignGoals: '',
    brandGuidelines: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, [searchTerm, selectedClient, selectedStatus, selectedClientId, isClientDataIsolated]);

  // Auto-select current client when in client workspace mode
  useEffect(() => {
    if (isClientDataIsolated && selectedClientId && selectedClient !== selectedClientId) {
      setSelectedClient(selectedClientId);
    } else if (!isClientDataIsolated && selectedClient) {
      setSelectedClient('');
    }
  }, [selectedClientId, isClientDataIsolated]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      // Use client context for filtering
      if (isClientDataIsolated && selectedClientId) {
        params.append('client', selectedClientId);
      } else if (selectedClient) {
        params.append('client', selectedClient);
      }

      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/campaigns?${params.toString()}`, {
        headers: {
          // Add client context header for API isolation
          ...(selectedClientId && { 'x-client-id': selectedClientId })
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch campaigns');
      }

      setCampaigns(data.data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };



  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Auto-set client if in client workspace mode
    const formData = {
      ...createForm,
      clientId: isClientDataIsolated && selectedClientId ? selectedClientId : createForm.clientId
    };

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add client context header for API isolation
          ...(selectedClientId && { 'x-client-id': selectedClientId })
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create campaign');
      }

      setSuccess('Campaign created successfully');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        clientId: '',
        startDate: '',
        endDate: '',
        postsPerWeek: 3,
        platforms: [],
        targetAudience: '',
        campaignGoals: '',
        brandGuidelines: '',
      });
      fetchCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete campaign');
      }

      setSuccess('Campaign deleted successfully');
      fetchCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
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

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'bg-success-100 text-success-800';
      case CampaignStatus.PAUSED:
        return 'bg-warning-100 text-warning-800';
      case CampaignStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isClientDataIsolated && currentClient
                    ? `${currentClient.brandName} - Campaigns`
                    : 'Campaigns'
                  }
                </h1>
                <p className="mt-2 text-gray-600">
                  {isClientDataIsolated && currentClient
                    ? `Manage campaigns for ${currentClient.brandName}`
                    : 'Manage your social media campaigns and content calendar'
                  }
                </p>
              </div>

              {checkPermission(PERMISSIONS.CREATE_CAMPAIGNS) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-info-600 text-white px-4 py-2 rounded-md hover:bg-info-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Campaign
                </button>
              )}
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

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                />
              </div>

              {/* Only show client selector in admin mode */}
              {!isClientDataIsolated && (
                <div>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    title="Filter campaigns by client"
                    aria-label="Filter campaigns by client"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                  >
                    <option value="">All Clients</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.brandName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  title="Filter campaigns by status"
                  aria-label="Filter campaigns by status"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                >
                  <option value="">All Statuses</option>
                  {Object.values(CampaignStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    if (!isClientDataIsolated) {
                      setSelectedClient('');
                    }
                    setSelectedStatus('');
                  }}
                  className="w-full bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Campaigns Grid */}
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedClient || selectedStatus
                    ? 'Try adjusting your filters.'
                    : 'Get started by creating your first campaign.'
                  }
                </p>
                {checkPermission(PERMISSIONS.CREATE_CAMPAIGNS) && !searchTerm && !selectedClient && !selectedStatus && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-info-600 text-white px-4 py-2 rounded-md hover:bg-info-700"
                  >
                    Create Your First Campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                  const daysRemaining = getDaysRemaining(campaign.endDate);

                  return (
                    <div key={campaign.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {campaign.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {campaign.client.brandName}
                            </p>
                            {campaign.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {campaign.description}
                              </p>
                            )}
                          </div>

                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>

                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Start:</span>
                            <span className="text-gray-900">{formatDate(campaign.startDate)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">End:</span>
                            <span className="text-gray-900">{formatDate(campaign.endDate)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Posts:</span>
                            <span className="text-gray-900">{campaign._count.posts}</span>
                          </div>
                          {daysRemaining > 0 && campaign.status === CampaignStatus.ACTIVE && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Days left:</span>
                              <span className="text-info-600 font-medium">{daysRemaining}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/campaigns/${campaign.id}`}
                            className="flex-1 bg-info-600 text-white text-center py-2 px-3 rounded-md text-sm hover:bg-info-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            View Details
                          </Link>

                          <Link
                            href={`/dashboard/campaigns/${campaign.id}/calendar`}
                            className="bg-success-600 text-white py-2 px-3 rounded-md text-sm hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Calendar
                          </Link>

                          {checkPermission(PERMISSIONS.DELETE_CAMPAIGNS) && (
                            <button
                              onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                              className="bg-error-600 text-white py-2 px-3 rounded-md text-sm hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Campaign Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Create New Campaign
                    </h3>

                    <form onSubmit={handleCreateCampaign} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-2">
                            Campaign Name *
                          </label>
                          <input
                            id="campaign-name"
                            type="text"
                            required
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            title="Enter campaign name"
                            aria-label="Campaign name"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                            placeholder="Enter campaign name"
                          />
                        </div>

                        {/* Only show client selector in admin mode */}
                        {!isClientDataIsolated && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Client *
                            </label>
                            <select
                              required
                              value={createForm.clientId}
                              onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
                              title="Select client for campaign"
                              aria-label="Select client for campaign"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                            >
                              <option value="">Select a client</option>
                              {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.brandName}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Show selected client in client mode */}
                        {isClientDataIsolated && currentClient && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Client
                            </label>
                            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700">
                              {currentClient.brandName}
                            </div>
                          </div>
                        )}

                        <div>
                          <label htmlFor="campaign-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                          </label>
                          <input
                            id="campaign-start-date"
                            type="date"
                            required
                            value={createForm.startDate}
                            onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                            title="Select campaign start date"
                            aria-label="Campaign start date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          />
                        </div>

                        <div>
                          <label htmlFor="campaign-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                            End Date *
                          </label>
                          <input
                            id="campaign-end-date"
                            type="date"
                            required
                            value={createForm.endDate}
                            onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                            title="Select campaign end date"
                            aria-label="Campaign end date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          />
                        </div>

                        <div>
                          <label htmlFor="posts-per-week" className="block text-sm font-medium text-gray-700 mb-2">
                            Posts per Week
                          </label>
                          <input
                            id="posts-per-week"
                            type="number"
                            min="1"
                            max="21"
                            value={createForm.postsPerWeek}
                            onChange={(e) => setCreateForm({ ...createForm, postsPerWeek: parseInt(e.target.value) })}
                            title="Number of posts per week (1-21)"
                            aria-label="Posts per week"
                            placeholder="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          id="campaign-description"
                          value={createForm.description}
                          onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                          rows={3}
                          title="Brief description of the campaign"
                          aria-label="Campaign description"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          placeholder="Brief description of the campaign"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Social Media Platforms *
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="target-audience" className="block text-sm font-medium text-gray-700 mb-2">
                            Target Audience
                          </label>
                          <textarea
                            id="target-audience"
                            value={createForm.targetAudience}
                            onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })}
                            rows={3}
                            title="Describe the target audience"
                            aria-label="Target audience"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                            placeholder="Describe the target audience"
                          />
                        </div>

                        <div>
                          <label htmlFor="campaign-goals" className="block text-sm font-medium text-gray-700 mb-2">
                            Campaign Goals
                          </label>
                          <textarea
                            id="campaign-goals"
                            value={createForm.campaignGoals}
                            onChange={(e) => setCreateForm({ ...createForm, campaignGoals: e.target.value })}
                            rows={3}
                            title="What are the main goals of this campaign?"
                            aria-label="Campaign goals"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                            placeholder="What are the main goals of this campaign?"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="brand-guidelines" className="block text-sm font-medium text-gray-700 mb-2">
                          Brand Guidelines
                        </label>
                        <textarea
                          id="brand-guidelines"
                          value={createForm.brandGuidelines}
                          onChange={(e) => setCreateForm({ ...createForm, brandGuidelines: e.target.value })}
                          rows={3}
                          title="Any specific brand guidelines or requirements"
                          aria-label="Brand guidelines"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-info-500"
                          placeholder="Any specific brand guidelines or requirements"
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
                          Create Campaign
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