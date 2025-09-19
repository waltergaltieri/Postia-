'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Calendar,
  Zap,
  Settings,
  Building2,
  Palette,
  BarChart3,
  FileText,
  Image,
  Sparkles,
  ChevronDown,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import TourManagementHub from '@/components/onboarding/tour-management-hub'
import TourProgressIndicator from './tour-progress-indicator'
import ClientSelector from './client-selector'
import { useTourNavigation } from '@/hooks/use-tour-navigation'
import '@/styles/sidebar-layout-fixes.css'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
  children?: NavigationItem[]
}

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
}

interface NavigationSidebarProps {
  currentClient?: Client | null
  clients?: Client[]
  onClientChange?: (client: Client) => void
  onCollapseChange?: (collapsed: boolean) => void
  className?: string
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'content',
    label: 'Content Generation',
    icon: Sparkles,
    href: '/dashboard/content',
    children: [
      {
        id: 'ai-generation',
        label: 'AI Generation',
        icon: Zap,
        href: '/dashboard/content/generate'
      },
      {
        id: 'content-library',
        label: 'Content Library',
        icon: FileText,
        href: '/dashboard/content/library'
      },
      {
        id: 'templates',
        label: 'Templates',
        icon: Image,
        href: '/dashboard/content/templates'
      }
    ]
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: BarChart3,
    href: '/dashboard/campaigns',
    children: [
      {
        id: 'campaign-overview',
        label: 'Overview',
        icon: BarChart3,
        href: '/dashboard/campaigns'
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: Calendar,
        href: '/dashboard/campaigns/calendar'
      }
    ]
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    href: '/dashboard/clients'
  },
  {
    id: 'brand-assets',
    label: 'Brand Assets',
    icon: Palette,
    href: '/dashboard/brand-assets'
  },

  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings'
  }
]

export default function NavigationSidebar({
  currentClient,
  clients = [],
  onClientChange,
  onCollapseChange,
  className
}: NavigationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['content', 'campaigns'])
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Tour navigation integration
  const { tourNavState, handleNavigationAttempt } = useTourNavigation({
    showProgressIndicator: true,
    lockNavigationDuringTour: true,
    addTourBreadcrumbs: true
  })

  // Mobile detection and responsive behavior
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false)
    }
  }, [pathname, isMobile])

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobile, isMobileOpen])

  // Update CSS custom property for main content margin and notify parent
  useEffect(() => {
    const root = document.documentElement
    if (isMobile) {
      root.style.setProperty('--current-sidebar-width', '0px')
    } else if (isCollapsed) {
      root.style.setProperty('--current-sidebar-width', 'var(--sidebar-collapsed-width)')
    } else {
      root.style.setProperty('--current-sidebar-width', 'var(--sidebar-width)')
    }
    
    // Notify parent component about collapse state
    onCollapseChange?.(isCollapsed)
  }, [isCollapsed, isMobile, onCollapseChange])

  // Auto-expand parent items based on current path
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => pathname.startsWith(child.href))
        if (hasActiveChild && !expandedItems.includes(item.id)) {
          setExpandedItems(prev => [...prev, item.id])
        }
      }
    })
  }, [pathname])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string) => {
    // Check if navigation is allowed during active tour
    if (handleNavigationAttempt(href)) {
      router.push(href)
    }
  }

  const ClientBrandIndicator = ({ client }: { client: Client }) => (
    <div className="sidebar-client-indicator">
      {client.logoUrl ? (
        <img
          src={client.logoUrl}
          alt={client.brandName}
          className="sidebar-client-logo"
        />
      ) : (
        <div
          className="sidebar-client-avatar"
          style={{ backgroundColor: client.brandColors?.[0] || '#3b82f6' }}
        >
          {client.brandName.charAt(0).toUpperCase()}
        </div>
      )}
      {!isCollapsed && (
        <div className="sidebar-client-info">
          <p className="sidebar-client-name">
            {client.brandName}
          </p>
          <div className="sidebar-client-colors">
            {client.brandColors?.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="sidebar-client-color"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={cn(
            "sidebar-mobile-overlay",
            isMobileOpen && "active"
          )}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "sidebar-container",
          isCollapsed && !isMobile && "sidebar-collapsed",
          isMobile && isMobileOpen && "mobile-open",
          className
        )}
      >
        {/* Header with Brand/Client Switcher */}
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            {!isCollapsed && (
              <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="sidebar-brand-text">
                  <h2 className="sidebar-brand-title">Postia</h2>
                  <p className="sidebar-brand-subtitle">Marketing Suite</p>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isMobile) {
                  setIsMobileOpen(false)
                } else {
                  setIsCollapsed(!isCollapsed)
                }
              }}
              className="sidebar-collapse-btn hover:bg-muted icon-btn-hover interactive-element touch-button"
            >
              {isMobile ? (
                <ChevronLeft className="h-4 w-4" />
              ) : isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}</Button>
          </div>

          {/* Tour Progress Indicator */}
          {tourNavState.showProgressInNav && tourNavState.activeTourId && (
            <div className={cn(
              "sidebar-tour-progress",
              isCollapsed && "compact"
            )}>
              <TourProgressIndicator
                compact={isCollapsed}
                showControls={!isCollapsed}
              />
            </div>
          )}

          {/* Enhanced Client Selector */}
          <div className="sidebar-client-selector">
            <ClientSelector
              compact={isCollapsed}
              showAdminToggle={true}
              onManageClients={() => handleNavigation('/dashboard/clients')}
              onAddClient={() => handleNavigation('/dashboard/clients/new')}
              onAdminDashboard={() => handleNavigation('/dashboard/admin')}
              className="w-full"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav">
          <nav className="sidebar-nav-list">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "sidebar-nav-item nav-item-hover interactive-element",
                    isActive(item.href) && "active nav-item-active"
                  )}
                  onClick={() => {
                    if (item.children) {
                      toggleExpanded(item.id)
                    } else {
                      handleNavigation(item.href)
                    }
                  }}
                ><div className="sidebar-nav-item-icon">
                    <item.icon className="h-4 w-4" />
                  </div>

                  {!isCollapsed && (
                    <>
                      <span className="sidebar-nav-item-label">{item.label}</span>

                      {item.badge && (
                        <Badge variant="secondary" className="sidebar-nav-item-badge responsive-text-xs">
                          {item.badge}
                        </Badge>
                      )}

                      {item.children && (
                        <ChevronDown className={cn(
                          "h-5 w-5 sidebar-nav-item-chevron",
                          expandedItems.includes(item.id) && "expanded"
                        )} />
                      )}
                    </>
                  )}
                </Button>

                {/* Submenu */}
                <AnimatePresence>
                  {item.children && expandedItems.includes(item.id) && !isCollapsed && (<motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="sidebar-submenu"
                  >
                    {item.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={isActive(child.href) ? "secondary" : "ghost"}
                        className={cn(
                          "sidebar-submenu-item nav-item-hover interactive-element",
                          isActive(child.href) && "active nav-item-active"
                        )}
                        onClick={() => handleNavigation(child.href)}
                      ><div className="sidebar-submenu-item-icon">
                          <child.icon className="h-3 w-3" />
                        </div>
                        <span className="sidebar-submenu-item-label">{child.label}</span>
                        {child.badge && (
                          <Badge variant="outline" className="sidebar-submenu-item-badge responsive-text-xs">
                            {child.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer with User Info */}
        <div className="sidebar-footer">
          {!isCollapsed ? (
            <>
              {/* Tour Management Hub */}
              <div className="flex items-center justify-center">
                <TourManagementHub />
              </div>

              <Separator />

              {/* User Info */}
              <div className="sidebar-user-info">
                <div className="sidebar-user-avatar">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="sidebar-user-details">
                  <p className="sidebar-user-name">
                    Agency User
                  </p>
                  <p className="sidebar-user-plan">
                    Premium Plan
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="sidebar-user-settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <TourManagementHub className="w-full" />
              <Button variant="ghost" size="sm" className="w-full h-10 p-0">
                <User className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse/Expand Handle - Desktop only */}
        {!isMobile && (
          <motion.div
            className="sidebar-external-handle"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}</Button>
          </motion.div>
        )}
      </div>
    </>
  )
}