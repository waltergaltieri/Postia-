'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  Sparkles,
  ArrowUpRight,
  Activity
} from 'lucide-react'
import ClientWorkspaceLayout from '@/components/layouts/client-workspace-layout'
import { 
  ClientCard, 
  ClientButton, 
  ClientBadge,
  ClientBrandColors 
} from '@/components/ui/client-themed-components'
import { useNavigation, useClientManagement } from '@/components/navigation/navigation-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricCardProps {
  title: string
  value: string | number
  change: string
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  }

  return (
    <ClientCard variant="default" className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trendColors[trend]} flex items-center mt-1`}>
          <TrendingUp className="h-3 w-3 mr-1" />
          {change}
        </p>
      </CardContent>
    </ClientCard>
  )
}

export default function ClientDashboardPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const { currentClient, switchToClient, clients } = useNavigation()
  const { selectedClientId } = useClientManagement()

  // Ensure we're switched to the correct client
  useEffect(() => {
    if (clientId && clientId !== selectedClientId) {
      const client = clients.find(c => c.id === clientId)
      if (client) {
        switchToClient(clientId)
      }
    }
  }, [clientId, selectedClientId, clients, switchToClient])

  if (!currentClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client workspace...</p>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      title: 'Total Campaigns',
      value: 12,
      change: '+2 this month',
      icon: BarChart3,
      trend: 'up' as const
    },
    {
      title: 'Active Content',
      value: 48,
      change: '+12% from last month',
      icon: FileText,
      trend: 'up' as const
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      change: '+0.3% from last week',
      icon: Activity,
      trend: 'up' as const
    },
    {
      title: 'Scheduled Posts',
      value: 24,
      change: 'Next 7 days',
      icon: Calendar,
      trend: 'neutral' as const
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'content',
      title: 'New blog post generated',
      description: '"Summer Marketing Trends 2024"',
      time: '2 hours ago',
      icon: Sparkles
    },
    {
      id: 2,
      type: 'campaign',
      title: 'Campaign performance update',
      description: 'Q2 Social Media Campaign',
      time: '4 hours ago',
      icon: BarChart3
    },
    {
      id: 3,
      type: 'content',
      title: 'Social media posts scheduled',
      description: '5 posts for next week',
      time: '1 day ago',
      icon: Calendar
    }
  ]

  return (
    <ClientWorkspaceLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back to {currentClient.brandName}
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your marketing campaigns
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ClientBrandColors showLabels />
              <ClientButton>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </ClientButton>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <ClientCard>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest updates from your campaigns and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-full bg-primary/10">
                      <activity.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <ClientButton variant="outline" className="w-full">
                    View All Activity
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </ClientButton>
                </div>
              </CardContent>
            </ClientCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ClientCard>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks for {currentClient.brandName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ClientButton className="w-full justify-start" variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New Content
                </ClientButton>
                <ClientButton className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Posts
                </ClientButton>
                <ClientButton className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </ClientButton>
                <ClientButton className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team
                </ClientButton>
              </CardContent>
            </ClientCard>
          </motion.div>
        </div>

        {/* Campaign Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ClientCard variant="branded" className="text-white">
            <CardHeader>
              <CardTitle className="text-white">Active Campaigns</CardTitle>
              <CardDescription className="text-white/80">
                Your current marketing campaigns performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-white/80">Active Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">12.4K</div>
                  <div className="text-sm text-white/80">Total Reach</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">4.2%</div>
                  <div className="text-sm text-white/80">Avg. Engagement</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <ClientButton variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
                  View Campaign Details
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </ClientButton>
              </div>
            </CardContent>
          </ClientCard>
        </motion.div>
      </div>
    </ClientWorkspaceLayout>
  )
}