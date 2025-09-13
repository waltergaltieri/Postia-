'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';
import { AssetType } from '@/generated/prisma';
import Link from 'next/link';

interface Client {
    id: string;
    brandName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    industry: string | null;
    website: string | null;
    description: string | null;
    createdAt: string;
    brandAssets: Array<{
        id: string;
        type: AssetType;
        name: string;
        url: string;
        metadata: any;
        createdAt: string;
    }>;
    assignedUsers: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
    }>;
    campaigns: Array<{
        id: string;
        name: string;
        status: string;
        createdAt: string;
    }>;
    _count: {
        campaigns: number;
        posts: number;
    };
}

interface User {
    id: string;
    name: string;
    email: string;
}

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { checkPermission } = usePermissions();
    const clientId = params.clientId as string;

    const [client, setClient] = useState<Client | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'campaigns'>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Edit form state
    const [editForm, setEditForm] = useState({
        brandName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        industry: '',
        website: '',
        description: '',
        assignedUserIds: [] as string[],
    });

    // Asset form state
    const [assetForm, setAssetForm] = useState({
        type: AssetType.LOGO,
        name: '',
        url: '',
        metadata: {},
    });

    useEffect(() => {
        fetchClient();
        if (checkPermission(PERMISSIONS.EDIT_CLIENTS)) {
            fetchUsers();
        }
    }, [clientId]);

    const fetchClient = async () => {
        try {
            const response = await fetch(`/api/clients/${clientId}`);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    router.push('/dashboard/unauthorized');
                    return;
                }
                throw new Error(data.error?.message || 'Failed to fetch client');
            }

            setClient(data.data.client);
            setEditForm({
                brandName: data.data.client.brandName,
                contactName: data.data.client.contactName,
                contactEmail: data.data.client.contactEmail,
                contactPhone: data.data.client.contactPhone || '',
                industry: data.data.client.industry || '',
                website: data.data.client.website || '',
                description: data.data.client.description || '',
                assignedUserIds: data.data.client.assignedUsers.map((u: any) => u.id),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load client');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();

            if (response.ok) {
                setUsers(data.data.users);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`/api/clients/${clientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to update client');
            }

            setSuccess('Client updated successfully');
            setIsEditing(false);
            fetchClient();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update client');
        }
    };

    const handleCreateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`/api/clients/${clientId}/assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assetForm),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to create asset');
            }

            setSuccess('Brand asset created successfully');
            setShowAssetModal(false);
            setAssetForm({
                type: AssetType.LOGO,
                name: '',
                url: '',
                metadata: {},
            });
            fetchClient();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create asset');
        }
    };

    const handleDeleteAsset = async (assetId: string, assetName: string) => {
        if (!confirm(`Are you sure you want to delete ${assetName}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/clients/${clientId}/assets/${assetId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to delete asset');
            }

            setSuccess('Brand asset deleted successfully');
            fetchClient();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete asset');
        }
    };

    const handleUserSelection = (userId: string, checked: boolean) => {
        setEditForm(prev => ({
            ...prev,
            assignedUserIds: checked
                ? [...prev.assignedUserIds, userId]
                : prev.assignedUserIds.filter(id => id !== userId)
        }));
    };

    const getAssetTypeIcon = (type: AssetType) => {
        switch (type) {
            case AssetType.LOGO:
                return '🎨';
            case AssetType.COLOR:
                return '🎨';
            case AssetType.FONT:
                return '🔤';
            case AssetType.IMAGE:
                return '🖼️';
            case AssetType.DOCUMENT:
                return '📄';
            default:
                return '📎';
        }
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!client) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Client not found</h2>
                        <Link
                            href="/dashboard/clients"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Back to Clients
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
                                        href="/dashboard/clients"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        ← Back to Clients
                                    </Link>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">{client.brandName}</h1>
                                <p className="mt-2 text-gray-600">
                                    {client.contactName} • {client.contactEmail}
                                </p>
                            </div>

                            {checkPermission(PERMISSIONS.EDIT_CLIENTS) && (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {isEditing ? 'Cancel Edit' : 'Edit Client'}
                                    </button>
                                    <button
                                        onClick={() => setShowAssetModal(true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        Add Asset
                                    </button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                {success}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="mb-6">
                            <nav className="flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('assets')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assets'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Brand Assets ({client.brandAssets.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('campaigns')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Campaigns ({client._count.campaigns})
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {isEditing ? (
                                    /* Edit Form */
                                    <div className="bg-white shadow rounded-lg p-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Client Information</h3>

                                        <form onSubmit={handleUpdateClient} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Brand Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={editForm.brandName}
                                                        onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Contact Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={editForm.contactName}
                                                        onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Contact Email *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={editForm.contactEmail}
                                                        onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Contact Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={editForm.contactPhone}
                                                        onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Industry
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.industry}
                                                        onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Website
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={editForm.website}
                                                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            {users.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Assign Team Members
                                                    </label>
                                                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                        {users.map((teamUser) => (
                                                            <label key={teamUser.id} className="flex items-center space-x-2 py-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editForm.assignedUserIds.includes(teamUser.id)}
                                                                    onChange={(e) => handleUserSelection(teamUser.id, e.target.checked)}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-sm text-gray-700">
                                                                    {teamUser.name} ({teamUser.email})
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    Update Client
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    /* Client Information Display */
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Info */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div className="bg-white shadow rounded-lg p-6">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>

                                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">Brand Name</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">{client.brandName}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">Contact Name</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">{client.contactName}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">{client.contactEmail}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">{client.contactPhone || 'Not provided'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">Industry</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">{client.industry || 'Not specified'}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-sm font-medium text-gray-500">Website</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">
                                                            {client.website ? (
                                                                <a
                                                                    href={client.website}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                >
                                                                    {client.website}
                                                                </a>
                                                            ) : (
                                                                'Not provided'
                                                            )}
                                                        </dd>
                                                    </div>
                                                </dl>

                                                {client.description && (
                                                    <div className="mt-6">
                                                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">{client.description}</dd>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recent Campaigns */}
                                            <div className="bg-white shadow rounded-lg p-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
                                                    <Link
                                                        href={`/dashboard/campaigns?client=${clientId}`}
                                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        View all campaigns
                                                    </Link>
                                                </div>

                                                {client.campaigns.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {client.campaigns.map((campaign) => (
                                                            <div key={campaign.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                                                                    <p className="text-sm text-gray-500">
                                                                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                                    campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {campaign.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-center py-4">No campaigns yet</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sidebar */}
                                        <div className="space-y-6">
                                            {/* Stats */}
                                            <div className="bg-white shadow rounded-lg p-6">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>

                                                <div className="space-y-4">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Total Campaigns</span>
                                                        <span className="text-sm font-medium text-gray-900">{client._count.campaigns}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Total Posts</span>
                                                        <span className="text-sm font-medium text-gray-900">{client._count.posts}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Brand Assets</span>
                                                        <span className="text-sm font-medium text-gray-900">{client.brandAssets.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Client Since</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {new Date(client.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Assigned Team */}
                                            <div className="bg-white shadow rounded-lg p-6">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Team</h3>

                                                {client.assignedUsers.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {client.assignedUsers.map((assignedUser) => (
                                                            <div key={assignedUser.id} className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-blue-600">
                                                                        {assignedUser.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{assignedUser.name}</p>
                                                                    <p className="text-xs text-gray-500">{assignedUser.role}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">No team members assigned</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'assets' && (
                            <div className="space-y-6">
                                {client.brandAssets.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {client.brandAssets.map((asset) => (
                                            <div key={asset.id} className="bg-white shadow rounded-lg overflow-hidden">
                                                <div className="p-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-2xl">{getAssetTypeIcon(asset.type)}</span>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{asset.name}</h4>
                                                                <p className="text-sm text-gray-500">{asset.type}</p>
                                                            </div>
                                                        </div>

                                                        {checkPermission(PERMISSIONS.EDIT_CLIENTS) && (
                                                            <button
                                                                onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                                                className="text-red-600 hover:text-red-800 text-sm"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="mb-4">
                                                        <a
                                                            href={asset.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 text-sm break-all"
                                                        >
                                                            View Asset
                                                        </a>
                                                    </div>

                                                    <p className="text-xs text-gray-500">
                                                        Added {new Date(asset.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No brand assets</h3>
                                        <p className="text-gray-500 mb-4">
                                            Start building the brand identity by adding logos, colors, fonts, and other assets.
                                        </p>
                                        {checkPermission(PERMISSIONS.EDIT_CLIENTS) && (
                                            <button
                                                onClick={() => setShowAssetModal(true)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                            >
                                                Add First Asset
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'campaigns' && (
                            <div className="space-y-6">
                                {client.campaigns.length > 0 ? (
                                    <div className="bg-white shadow rounded-lg overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200">
                                            <h3 className="text-lg font-medium text-gray-900">All Campaigns</h3>
                                        </div>
                                        <div className="divide-y divide-gray-200">
                                            {client.campaigns.map((campaign) => (
                                                <div key={campaign.id} className="px-6 py-4 hover:bg-gray-50">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                Created {new Date(campaign.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                                campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {campaign.status}
                                                            </span>
                                                            <Link
                                                                href={`/dashboard/campaigns/${campaign.id}`}
                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns</h3>
                                        <p className="text-gray-500 mb-4">
                                            Create your first campaign for this client to start managing their social media presence.
                                        </p>
                                        <Link
                                            href={`/dashboard/campaigns/create?client=${clientId}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                        >
                                            Create Campaign
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create Asset Modal */}
                        {showAssetModal && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                                <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                                    <div className="mt-3">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Add Brand Asset
                                        </h3>

                                        <form onSubmit={handleCreateAsset} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Asset Type *
                                                </label>
                                                <select
                                                    required
                                                    value={assetForm.type}
                                                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as AssetType })}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {Object.values(AssetType).map((type) => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Asset Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={assetForm.name}
                                                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter asset name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Asset URL *
                                                </label>
                                                <input
                                                    type="url"
                                                    required
                                                    value={assetForm.url}
                                                    onChange={(e) => setAssetForm({ ...assetForm, url: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://example.com/asset.png"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAssetModal(false)}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    Add Asset
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