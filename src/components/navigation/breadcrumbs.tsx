'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ChevronRight, 
  Home, 
  Building2, 
  Users, 
  Calendar, 
  Zap, 
  Settings,
  BarChart3,
  FileText,
  Image,
  Sparkles,
  Palette,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  metadata?: {
    clientName?: string
    campaignName?: string
    contentType?: string
    status?: string
  }
}

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface BreadcrumbsProps {
  currentClient?: Client | null
  currentCampaign?: Campaign | null
  customItems?: BreadcrumbItem[]
  showProgress?: boolean
  workflowStep?: number
  totalSteps?: number
  className?: string
}

const routeConfig: Record<string, { 
  label: string
  icon: React.ComponentType<{ className?: string }>
  parent?: string
}> = {
  '/dashboard': { label: 'Dashboard', icon: Home },
  '/dashboard/content': { label: 'Content', icon: Sparkles, parent: '/dashboard' },
  '/dashboard/content/generate': { label: 'AI Generation', icon: Zap, parent: '/dashboard/content' },
  '/dashboard/content/library': { label: 'Library', icon: FileText, parent: '/dashboard/content' },
  '/dashboard/content/templates': { label: 'Templates', icon: Image, parent: '/dashboard/content' },
  '/dashboard/campaigns': { label: 'Campaigns', icon: BarChart3, parent: '/dashboard' },
  '/dashboard/campaigns/calendar': { label: 'Calendar', icon: Calendar, parent: '/dashboard/campaigns' },
  '/dashboard/clients': { label: 'Clients', icon: Users, parent: '/dashboard' },
  '/dashboard/brand-assets': { label: 'Brand Assets', icon: Palette, parent: '/dashboard' },
  '/dashboard/settings': { label: 'Settings', icon: Settings, parent: '/dashboard' }
}

export default function Breadcrumbs({
  currentClient,
  currentCampaign,
  customItems,
  showProgress = false,
  workflowStep = 0,
  totalSteps = 0,
  className
}: BreadcrumbsProps) {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems
    }

    const items: BreadcrumbItem[] = []
    const pathSegments = pathname.split('/').filter(Boolean)
    
    // Build path progressively
    let currentPath = ''
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const config = routeConfig[currentPath]
      
      if (config) {
        items.push({
          label: config.label,
          href: currentPath,
          icon: config.icon,
          isActive: index === pathSegments.length - 1
        })
      }
    })

    // Add client context if available
    if (currentClient && items.length > 1) {
      const clientItem: BreadcrumbItem = {
        label: currentClient.brandName,
        href: `/dashboard/clients/${currentClient.id}`,
        metadata: { clientName: currentClient.brandName }
      }
      
      // Insert client context after dashboard
      items.splice(1, 0, clientItem)
    }

    // Add campaign context if available
    if (currentCampaign && items.length > 1) {
      const campaignItem: BreadcrumbItem = {
        label: currentCampaign.name,
        href: `/dashboard/campaigns/${currentCampaign.id}`,
        metadata: { 
          campaignName: currentCampaign.name,
          status: currentCampaign.status
        }
      }
      
      // Insert campaign context appropriately
      const insertIndex = currentClient ? 2 : 1
      items.splice(insertIndex, 0, campaignItem)
    }

    return items
  }

  const breadcrumbs = generateBreadcrumbs()

  const ClientIndicator = ({ client }: { client: Client }) => (
    <div className="flex items-center space-x-2 px-2 py-1 bg-muted/50 rounded-md">
      {client.logoUrl ? (
        <img 
          src={client.logoUrl} 
          alt={client.brandName}
          className="w-4 h-4 rounded object-cover"
        />
      ) : (
        <div 
          className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: client.brandColors?.[0] || '#3b82f6' }}
        >
          {client.brandName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium">{client.brandName}</span>
      <div className="flex space-x-1">
        {client.brandColors?.slice(0, 2).map((color, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )

  const WorkflowProgress = () => (
    <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-md">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span className="text-xs font-medium text-primary">
          Step {workflowStep} of {totalSteps}
        </span>
      </div>
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(workflowStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )

  return (
    <div className={cn(
      "flex items-center space-x-2 py-3 px-4 bg-background/95 backdrop-blur-sm",
      "border-b border-border/50 sticky top-0 z-40",
      className
    )}>
      {/* Client Context */}
      {currentClient && (
        <>
          <ClientIndicator client={currentClient} />
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-1 flex-1">
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
                <div className="flex items-center space-x-2 px-2 py-1 bg-secondary rounded-md">
                  {item.icon && <item.icon className="h-3 w-3" />}
                  <span className="text-sm font-medium text-secondary-foreground">
                    {item.label}
                  </span>
                  {item.metadata?.status && (
                    <Badge variant="outline" className="text-xs">
                      {item.metadata.status}
                    </Badge>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href={item.href}>
                    <div className="flex items-center space-x-2">
                      {item.icon && <item.icon className="h-3 w-3" />}
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                </Button>
              )}
            </motion.div>
          </div>
        ))}
      </nav>

      {/* Campaign Context */}
      {currentCampaign && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center space-x-2 px-2 py-1 bg-muted/30 rounded-md">
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{currentCampaign.name}</span>
            <Badge 
              variant={currentCampaign.status === 'ACTIVE' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {currentCampaign.status}
            </Badge>
          </div>
        </>
      )}

      {/* Workflow Progress */}
      {showProgress && totalSteps > 0 && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <WorkflowProgress />
        </>
      )}

      {/* Quick Actions */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => window.history.back()}
        >
          <ArrowRight className="h-3 w-3 rotate-180" />
        </Button>
      </div>
    </div>
  )
}

// Hook for easy breadcrumb management
export function useBreadcrumbs() {
  const pathname = usePathname()
  
  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    // This could be enhanced with a context provider for global breadcrumb state
    return items
  }

  const addBreadcrumb = (item: BreadcrumbItem) => {
    // Add a single breadcrumb item
    return item
  }

  return {
    pathname,
    setBreadcrumbs,
    addBreadcrumb
  }
}