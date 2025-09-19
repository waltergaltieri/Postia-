'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  ArrowLeft, 
  Settings, 
  BarChart3,
  Users,
  Palette,
  FileText,
  Calendar,
  Sparkles,
  Zap,
  Home,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useNavigation, useClientManagement } from '@/components/navigation/navigation-context'
import ClientSelector from '@/components/navigation/client-selector'
import { useMobile } from '@/hooks/use-mobile'
import { 
  ClientBrandHeader, 
  ClientButton, 
  ClientBadge, 
  ClientWorkspaceIndicator 
} from '@/components/ui/client-themed-components'
import { useClientTheme } from '@/components/providers/client-theme-provider'

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
  industry?: string
  isActive?: boolean
}

interface ClientWorkspaceLayoutProps {
  children: React.ReactNode
  className?: string
}

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
  description?: string
  isExternal?: boolean
}

// Client-specific navigation items
const getClientNavigationItems = (clientId: string): NavigationItem[] => [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    href: `/dashboard/client/${clientId}`,
    description: 'Client dashboard and metrics'
  },
  {
    id: 'content',
    label: 'Content Generation',
    icon: Sparkles,
    href: `/dashboard/client/${clientId}/content`,
    description: 'AI-powered content creation'
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: BarChart3,
    href: `/dashboard/client/${clientId}/campaigns`,
    description: 'Campaign management and analytics'
  },
  {
    id: 'calendar',
    label: 'Content Calendar',
    icon: Calendar,
    href: `/dashboard/client/${clientId}/calendar`,
    description: 'Schedule and plan content'
  },
  {
    id: 'brand-assets',
    label: 'Brand Assets',
    icon: Palette,
    href: `/dashboard/client/${clientId}/brand-assets`,
    description: 'Logos, colors, and brand guidelines'
  },
  {
    id: 'library',
    label: 'Content Library',
    icon: FileText,
    href: `/dashboard/client/${clientId}/library`,
    description: 'All generated content'
  },
  {
    id: 'settings',
    label: 'Client Settings',
    icon: Settings,
    href: `/dashboard/client/${clientId}/settings`,
    description: 'Client-specific configuration'
  }
]

interface ClientBreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
}

export default function ClientWorkspaceLayout({ 
  children, 
  className 
}: ClientWorkspaceLayoutProps) {
  const pathname = usePathname()
  const isMobile = useMobile()
  const { currentClient, switchToAdminDashboard } = useNavigation()
  const { selectedClientId, clientWorkspaceMode } = useClientManagement()
  const { isClientThemeActive } = useClientTheme()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<ClientBreadcrumbItem[]>([])

  // Generate client-specific breadcrumbs
  useEffect(() => {
    if (!currentClient) return

    const pathSegments = pathname.split('/').filter(Boolean)
    const items: ClientBreadcrumbItem[] = []

    // Always start with client context
    items.push({
      label: currentClient.brandName,
      href: `/dashboard/client/${currentClient.id}`,
      icon: Building2
    })

    // Map path segments to breadcrumb items
    if (pathSegments.includes('content')) {
      items.push({
        label: 'Content',
        href: `/dashboard/client/${currentClient.id}/content`,
        icon: Sparkles
      })
      
      if (pathSegments.includes('generate')) {
        items.push({
          label: 'Generate',
          href: `/dashboard/client/${currentClient.id}/content/generate`,
          icon: Zap,
          isActive: true
        })
      }
    } else if (pathSegments.includes('campaigns')) {
      items.push({
        label: 'Campaigns',
        href: `/dashboard/client/${currentClient.id}/campaigns`,
        icon: BarChart3,
        isActive: !pathSegments.includes('calendar')
      })
    } else if (pathSegments.includes('calendar')) {
      items.push({
        label: 'Calendar',
        href: `/dashboard/client/${currentClient.id}/calendar`,
        icon: Calendar,
        isActive: true
      })
    } else if (pathSegments.includes('brand-assets')) {
      items.push({
        label: 'Brand Assets',
        href: `/dashboard/client/${currentClient.id}/brand-assets`,
        icon: Palette,
        isActive: true
      })
    } else if (pathSegments.includes('library')) {
      items.push({
        label: 'Library',
        href: `/dashboard/client/${currentClient.id}/library`,
        icon: FileText,
        isActive: true
      })
    } else if (pathSegments.includes('settings')) {
      items.push({
        label: 'Settings',
        href: `/dashboard/client/${currentClient.id}/settings`,
        icon: Settings,
        isActive: true
      })
    } else {
      // Mark overview as active if we're at the root client path
      items[0].isActive = true
    }

    setBreadcrumbs(items)
  }, [pathname, currentClient])

  // Don't render if not in client workspace mode or no client selected
  if (clientWorkspaceMode !== 'client' || !currentClient || !selectedClientId) {
    return <div>{children}</div>
  }

  const navigationItems = getClientNavigationItems(currentClient.id)
  const isActive = (href: string) => {
    if (href === `/dashboard/client/${currentClient.id}`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const ClientHeader = () => (
    <ClientBrandHeader
      showBackButton
      onBack={switchToAdminDashboard}
    >
      <ClientSelector compact showAdminToggle={false} />
      <ClientButton
        variant="outline"
        size="sm"
        onClick={() => window.open(`/dashboard/client/${currentClient.id}/settings`, '_blank')}
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Client Settings
      </ClientButton>
    </ClientBrandHeader>
  )

  const ClientBreadcrumbs = () => (
    <div className="flex items-center space-x-2 px-4 py-2 bg-muted/30 border-b border-border">
      <nav className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <div key={item.href} className="flex items-center space-x-1">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.isActive ? (
                <div className="flex items-center space-x-2 px-2 py-1 bg-primary/10 rounded-md">
                  {item.icon && <item.icon className="h-3 w-3 text-primary" />}
                  <span className="text-sm font-medium text-primary">
                    {item.label}
                  </span>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-muted-foreground hover:text-foreground"
                  onClick={() => window.location.href = item.href}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon && <item.icon className="h-3 w-3" />}
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Button>
              )}
            </motion.div>
          </div>
        ))}
      </nav>
    </div>
  )

  const ClientNavigation = () => (
    <div className="w-64 bg-background border-r border-border flex flex-col">
      {/* Navigation Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">Client Workspace</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Working in {currentClient.brandName}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => (
          <ClientButton
            key={item.id}
            variant={isActive(item.href) ? "secondary" : "ghost"}
            useClientTheme={isActive(item.href)}
            className={cn(
              "w-full justify-start h-auto p-3 text-left client-nav-item",
              isActive(item.href) && "active"
            )}
            onClick={() => window.location.href = item.href}
          >
            <div className="flex items-start space-x-3 w-full">
              <item.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <ClientBadge variant="secondary" className="text-xs">
                      {item.badge}
                    </ClientBadge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs opacity-70 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </ClientButton>
        ))}
      </nav>

      {/* Client Quick Stats */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Campaigns</span>
            <ClientBadge variant="outline" useClientTheme={false}>3</ClientBadge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Content Generated</span>
            <ClientBadge variant="outline" useClientTheme={false}>24</ClientBadge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">This Month</span>
            <ClientBadge variant="secondary" clientVariant="accent">+12%</ClientBadge>
          </div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className={cn("min-h-screen bg-background client-workspace-layout client-workspace", className)}>
        <ClientHeader />
        <ClientBreadcrumbs />
        <main className="flex-1 content">
          {children}
        </main>
        <ClientWorkspaceIndicator />
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen flex bg-background client-workspace-layout client-workspace", className)}>
      <ClientNavigation />
      <div className="flex-1 flex flex-col min-w-0">
        <ClientHeader />
        <ClientBreadcrumbs />
        <main className="flex-1 overflow-auto content">
          {children}
        </main>
      </div>
      <ClientWorkspaceIndicator />
    </div>
  )
}