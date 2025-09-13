'use client';

import { useState, useEffect } from 'react';
import { SocialPlatform } from '@/generated/prisma';

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  isActive: boolean;
  expiresAt?: string;
  metadata: {
    profilePicture?: string;
    followerCount?: number;
    accountType?: string;
  };
}

interface SocialAccountManagerProps {
  clientId: string;
  onAccountsChange?: (accounts: SocialAccount[]) => void;
}

export default function SocialAccountManager({ clientId, onAccountsChange }: SocialAccountManagerProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [clientId]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/social/accounts?clientId=${clientId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch social accounts');
      }

      setAccounts(data.data.accounts);
      onAccountsChange?.(data.data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platform: SocialPlatform) => {
    try {
      setConnectingPlatform(platform);
      setError('');

      // Get OAuth URL
      const response = await fetch(`/api/social/oauth?platform=${platform}&clientId=${clientId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get OAuth URL');
      }

      // Redirect to OAuth URL
      window.location.href = data.data.oauthUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${accountName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/social/accounts/${accountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to disconnect account');
      }

      setSuccess('Account disconnected successfully');
      fetchAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    }
  };

  const handleRefresh = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to refresh token');
      }

      setSuccess('Access token refreshed successfully');
      fetchAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
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

  const getPlatformColor = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.FACEBOOK:
        return 'bg-blue-600 hover:bg-blue-700';
      case SocialPlatform.INSTAGRAM:
        return 'bg-pink-600 hover:bg-pink-700';
      case SocialPlatform.LINKEDIN:
        return 'bg-blue-700 hover:bg-blue-800';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const isTokenExpiring = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7; // Warn if expiring within 7 days
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Social Media Accounts</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Connected Accounts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                    <div>
                      <h5 className="font-medium text-gray-900">{account.accountName}</h5>
                      <p className="text-sm text-gray-500">{account.platform}</p>
                      {account.metadata.accountType && (
                        <p className="text-xs text-gray-400 capitalize">
                          {account.metadata.accountType} account
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {account.metadata.profilePicture && (
                    <img
                      src={account.metadata.profilePicture}
                      alt={account.accountName}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                </div>

                {account.metadata.followerCount && (
                  <div className="mt-3 text-sm text-gray-600">
                    {account.metadata.followerCount.toLocaleString()} followers
                  </div>
                )}

                {account.expiresAt && (
                  <div className="mt-3">
                    <p className={`text-xs ${
                      isTokenExpiring(account.expiresAt) ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      Token expires: {new Date(account.expiresAt).toLocaleDateString()}
                      {isTokenExpiring(account.expiresAt) && ' (Expiring soon!)'}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  {account.expiresAt && isTokenExpiring(account.expiresAt) && (
                    <button
                      onClick={() => handleRefresh(account.id)}
                      className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200"
                    >
                      Refresh Token
                    </button>
                  )}
                  <button
                    onClick={() => handleDisconnect(account.id, account.accountName)}
                    className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect New Accounts */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Connect New Account</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(SocialPlatform).map((platform) => {
            const isConnected = accounts.some(acc => acc.platform === platform && acc.isActive);
            const isConnecting = connectingPlatform === platform;
            
            return (
              <button
                key={platform}
                onClick={() => handleConnect(platform)}
                disabled={isConnecting}
                className={`flex items-center justify-center space-x-2 p-4 rounded-lg text-white transition-colors ${
                  isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                } ${getPlatformColor(platform)}`}
              >
                <span className="text-xl">{getPlatformIcon(platform)}</span>
                <span className="font-medium">
                  {isConnecting ? 'Connecting...' : 
                   isConnected ? `Reconnect ${platform}` : 
                   `Connect ${platform}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No social accounts connected</h3>
          <p className="text-gray-600">
            Connect your social media accounts to start publishing content automatically.
          </p>
        </div>
      )}
    </div>
  );
}