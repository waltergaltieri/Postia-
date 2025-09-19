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
  Search,
  Bell,
  User,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import TourManagementHub from '@/components/onboarding/tour-management-hub'
import TourProgressIndicator from './tour-progress-indicator'
import { useTourNavigation } from '@/hooks/use-tour-navigation'

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
  className 
}: NavigationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['content', 'campaigns'])
  const [showClientSwitcher, setShowClientSwitcher] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Tour navigation integration
  const { tourNavState, handleNavigationAttempt } = useTourNavigation({
    showProgressIndicator: true,
    lockNavigationDuringTour: true,
    addTourBreadcrumbs: true
  })

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
    <div className="flex items-center space-x-2">
      {client.logoUrl ? (
        <img 
          src={client.logoUrl} 
          alt={client.brandName}
          className="w-6 h-6 rounded object-cover"
        />
      ) : (
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: client.brandColors?.[0] || '#3b82f6' }}
        >
          {client.brandName.charAt(0).toUpperCase()}
        </div>
      )}
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {client.brandName}
          </p>
          <div className="flex space-x-1 mt-1">
            {client.brandColors?.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isCollapsed ? 80 : 280 
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      className={cn(
        "relative h-screen bg-card border-r border-border flex flex-col",
        "shadow-sm",
        className
      )}
    >
      {/* Header with Brand/Client Switcher */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Postia</h2>
                <p className="text-xs text-muted-foreground">Marketing Suite</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Tour Progress Indicator */}
        {tourNavState.showProgressInNav && tourNavState.activeTourId && (
          <div className="mt-3">
            <TourProgressIndicator 
              compact={isCollapsed}
              showControls={!isCollapsed}
              className={cn(
                isCollapsed && "px-2"
              )}
            />
          </div>
        )}

        {/* Client Switcher */}
        {currentClient && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start h-auto p-3",
                "hover:bg-muted/50 transition-colors",
                isCollapsed && "px-2"
              )}
              onClick={() => setShowClientSwitcher(!showClientSwitcher)}
            >
              <ClientBrandIndicator client={currentClient} />
              {!isCollapsed && (
                <ChevronDown className={cn(
                  "ml-auto h-4 w-4 transition-transform",
                  showClientSwitcher && "rotate-180"
                )} />
              )}
            </Button>

            <AnimatePresence>
              {showClientSwitcher && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 space-y-1 max-h-48 overflow-y-auto"
                >
                  {clients.map((client) => (
                    <Button
                      key={client.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 text-left"
                      onClick={() => {
                        onClientChange?.(client)
                        setShowClientSwitcher(false)
                      }}
                    >
                      <ClientBrandIndicator client={client} />
                    </Button>
                  ))}
                  
                  <Separator className="my-2" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => handleNavigation('/dashboard/clients')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Clients
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => (
            <div key={item.id}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  "hover:bg-muted/50 transition-all duration-200",
                  isActive(item.href) && "bg-secondary text-secondary-foreground shadow-sm",
                  isCollapsed && "px-2"
                )}
                onClick={() => {
                  if (item.children) {
                    toggleExpanded(item.id)
                  } else {
                    handleNavigation(item.href)
                  }
                }}
              >
                <item.icon className={cn(
                  "h-4 w-4",
                  !isCollapsed && "mr-3"
                )} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    
                    {item.children && (
                      <ChevronDown className={cn(
                        "ml-2 h-4 w-4 transition-transform",
                        expandedItems.includes(item.id) && "rotate-180"
                      )} />
                    )}
                  </>
                )}
              </Button>

              {/* Submenu */}
              <AnimatePresence>
                {item.children && expandedItems.includes(item.id) && !isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 mt-1 space-y-1"
                  >
                    {item.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={isActive(child.href) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-9 text-sm",
                          "hover:bg-muted/50 transition-colors",
                          isActive(child.href) && "bg-secondary/50 text-secondary-foreground"
                        )}
                        onClick={() => handleNavigation(child.href)}
                      >
                        <child.icon className="h-3 w-3 mr-3" />
                        <span>{child.label}</span>
                        {child.badge && (
                          <Badge variant="outline" className="ml-auto text-xs">
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
      <div className="p-3 border-t border-border">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Tour Management Hub */}
            <div className="flex items-center justify-center">
              <TourManagementHub />
            </div>
            
            <Separator />
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Agency User
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Premium Plan
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <TourManagementHub className="w-full" />
            <Button variant="ghost" size="sm" className="w-full h-10 p-0">
              <User className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Collapse/Expand Handle */}
      <motion.div
        className="absolute -right-3 top-20 z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0 rounded-full bg-background shadow-md border"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}