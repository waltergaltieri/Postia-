'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NavigationProvider, useNavigation } from '@/components/navigation/navigation-context'
import NavigationSidebar from '@/components/navigation/navigation-sidebar'
import MobileHeader from '@/components/navigation/mobile-header'
import MobileBottomNav from '@/components/navigation/mobile-bottom-nav'
import Breadcrumbs from '@/components/navigation/breadcrumbs'
import ClientSelector from '@/components/navigation/client-selector'
import MainFlowIntegration from '@/components/integration/main-flow-integration'
import PageTransitions from '@/components/integration/page-transitions'
import { motion } from 'framer-motion'
import { useMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const {
    currentClient,
    setCurrentClient,
    currentCampaign,
    setCurrentCampaign,
    clients,
    loading,
    workflowStep,
    totalSteps,
    // Enhanced client management features
    selectedClientId,
    clientWorkspaceMode,
    switchToClient,
    switchToAdminDashboard,
    isClientDataIsolated
  } = useNavigation()

  // Extract client/campaign from URL if present
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    
    // Check if we're in a client-specific route
    if (pathSegments.includes('clients') && pathSegments.length > 2) {
      const clientId = pathSegments[2]
      const client = clients.find(c => c.id === clientId)
      if (client && client.id !== currentClient?.id) {
        setCurrentClient(client)
      }
    }
    
    // Check if we're in a campaign-specific route
    if (pathSegments.includes('campaigns') && pathSegments.length > 2) {
      const campaignId = pathSegments[2]
      // This would typically fetch campaign data
      // For now, we'll use mock data
      if (campaignId !== currentCampaign?.id) {
        setCurrentCampaign({
          id: campaignId,
          name: 'Summer Campaign 2024',
          status: 'ACTIVE'
        })
      }
    }
  }, [pathname, clients, currentClient?.id, currentCampaign?.id, setCurrentClient, setCurrentCampaign])

  const handleClientChange = async (client: any) => {
    try {
      await switchToClient(client.id)
    } catch (error) {
      console.error('Error switching client:', error)
      // Fallback to legacy method if enhanced switching fails
      setCurrentClient(client)
    }
  }

  // Determine if we're in a workflow that should show progress
  const isInWorkflow = pathname.includes('/generate') || pathname.includes('/create')
  const currentWorkflowStep = isInWorkflow ? (workflowStep || 2) : 0
  const currentTotalSteps = isInWorkflow ? (totalSteps || 4) : 0

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Mobile Header */}
        <MobileHeader
          currentClient={currentClient}
          clients={clients}
          onClientChange={handleClientChange}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto pt-16 pb-20">
          <PageTransitions>
            {children}
          </PageTransitions>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Navigation Sidebar */}
      <NavigationSidebar
        currentClient={currentClient}
        clients={clients}
        onClientChange={handleClientChange}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Breadcrumbs */}
        <Breadcrumbs
          currentClient={currentClient}
          currentCampaign={currentCampaign}
          showProgress={isInWorkflow}
          workflowStep={currentWorkflowStep}
          totalSteps={currentTotalSteps}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <PageTransitions>
            {children}
          </PageTransitions>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <NavigationProvider>
      <MainFlowIntegration>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </MainFlowIntegration>
    </NavigationProvider>
  )
}