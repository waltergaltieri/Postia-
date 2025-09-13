'use client';

import { useState, useEffect } from 'react';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';

interface Agency {
  id: string;
  name: string;
  subscriptionPlan: string;
  tokenBalance: number;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
  };
}

export default function AgencySettingsPage() {
  const { user } = useAuth();
  const { checkPermission } = usePermissions();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    try {
      const response = await fetch('/api/agency');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch agency');
      }

      setAgency(data.data.agency);
      setEditName(data.data.agency.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agency');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Agency name is required');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/agency', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update agency');
      }

      setAgency(data.data.agency);
      setIsEditing(false);
      setSuccess('Agency updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agency');
    }
  };

  const handleCancel = () => {
    setEditName(agency?.name || '');
    setIsEditing(false);
    setError('');
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Agency Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your agency information and settings
              </p>
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

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Agency Information</h2>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Name
                  </label>
                  {isEditing ? (
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter agency name"
                      />
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">{agency?.name}</span>
                      {checkPermission(PERMISSIONS.MANAGE_AGENCY) && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subscription Plan
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {agency?.subscriptionPlan}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Balance
                    </label>
                    <span className="text-gray-900 font-medium">
                      {agency?.tokenBalance?.toLocaleString()} tokens
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created
                    </label>
                    <span className="text-gray-900">
                      {agency?.createdAt ? new Date(agency.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agency ID
                    </label>
                    <span className="text-gray-500 font-mono text-sm">{agency?.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Agency Statistics</h2>
              </div>
              
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {agency?._count.users || 0}
                    </div>
                    <div className="text-sm text-gray-500">Team Members</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {agency?._count.clients || 0}
                    </div>
                    <div className="text-sm text-gray-500">Clients</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      0
                    </div>
                    <div className="text-sm text-gray-500">Campaigns</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}