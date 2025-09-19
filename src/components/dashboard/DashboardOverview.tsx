'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigation, useClientManagement } from '@/components/navigation/navigation-context'
import Link from 'next/link'

interface DashboardOverviewProps {
  agency: any
  stats: {
    totalClients: number
    activeCampaigns: number
    tokenBalance: number
    recentJobs: number
  }
  recentJobs: any[]
}

export default function DashboardOverview({ agency, stats, recentJobs }: DashboardOverviewProps) {
  const { currentClient } = useNavigation();
  const { selectedClientId, clientWorkspaceMode, isClientDataIsolated } = useClientManagement();

  // Filter stats and data based on client context
  const getClientFilteredStats = () => {
    if (!isClientDataIsolated || !currentClient) {
      return stats;
    }

    // Find the current client in agency data
    const client = agency.clients.find((c: any) => c.id === currentClient.id);
    if (!client) return stats;

    return {
      totalClients: 1, // Only showing current client
      activeCampaigns: client.campaigns?.length || 0,
      tokenBalance: stats.tokenBalance, // Token balance is agency-wide
      recentJobs: recentJobs.filter((job: any) => job.clientId === currentClient.id).length
    };
  };

  const getClientFilteredJobs = () => {
    if (!isClientDataIsolated || !currentClient) {
      return recentJobs;
    }
    return recentJobs.filter((job: any) => job.clientId === currentClient.id);
  };

  const filteredStats = getClientFilteredStats();
  const filteredJobs = getClientFilteredJobs();

  return (
    <div className="space-y-8">
      {/* Client Context Header */}
      {isClientDataIsolated && currentClient && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentClient.logoUrl ? (
                  <img 
                    src={currentClient.logoUrl} 
                    alt={`${currentClient.brandName} logo`}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg border-2 border-primary/20"
                    style={{ backgroundColor: currentClient.brandColors[0] }}
                  >
                    {currentClient.brandName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {currentClient.brandName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Client Workspace Mode
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Client View
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {isClientDataIsolated ? 'Current Client' : 'Total Clients'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isClientDataIsolated ? 'Selected client' : 'Active accounts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isClientDataIsolated ? 'Client campaigns' : 'Running campaigns'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Token Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.tokenBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.recentJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isClientDataIsolated ? 'Client jobs' : 'Last 30 days'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isClientDataIsolated && currentClient 
              ? `Quick Actions for ${currentClient.brandName}`
              : 'Quick Actions'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/content/generate">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-2xl">🚀</span>
                <span>
                  {isClientDataIsolated ? 'Generate Content' : 'Generate Campaign Content'}
                </span>
              </Button>
            </Link>
            
            <Link href="/dashboard/campaigns">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-2xl">📊</span>
                <span>
                  {isClientDataIsolated ? 'View Campaigns' : 'Manage Campaigns'}
                </span>
              </Button>
            </Link>
            
            {!isClientDataIsolated ? (
              <Link href="/dashboard/clients">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl">👥</span>
                  <span>Manage Clients</span>
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/campaigns/calendar">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl">📅</span>
                  <span>View Calendar</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isClientDataIsolated && currentClient 
              ? `Recent Activity - ${currentClient.brandName}`
              : 'Recent Activity'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const result = job.result ? JSON.parse(job.result) : null
                return (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{job.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">
                        {result?.platform && `Platform: ${result.platform}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'COMPLETED' ? 'bg-success-100 text-success-800' :
                        job.status === 'FAILED' ? 'bg-error-100 text-error-800' :
                        'bg-warning-100 text-warning-800'
                      }`}>
                        {job.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.tokensConsumed} tokens
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {isClientDataIsolated && currentClient
                ? `No recent activity for ${currentClient.brandName}. Start by generating some content!`
                : 'No recent activity. Start by generating some content!'
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}