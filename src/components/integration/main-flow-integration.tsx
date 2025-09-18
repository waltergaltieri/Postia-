'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigation } from '@/components/navigation/navigation-context'
import { useWorkflowIntegration } from './workflow-integration'
import { toast } from 'sonner'
import { 
  Sparkles, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface FlowState {
  currentFlow: 'dashboard' | 'content-creation' | 'campaign-management' | 'client-management' | 'ai-generation'
  previousFlow?: string
  flowData?: any
  isTransitioning: boolean
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
  estimatedTime?: string
  requiresClient?: boolean
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'generate-content',
    title: 'Generate Content',
    description: 'Create new content with AI assistance',
    icon: Sparkles,
    href: '/dashboard/content/generate',
    badge: 'Popular',
    estimatedTime: '3-5 min',
    requiresClient: true
  },
  {
    id: 'view-calendar',
    title: 'Publication Calendar',
    description: 'Manage your content schedule',
    icon: Calendar,
    href: '/dashboard/campaigns/calendar',
    estimatedTime: '1 min'
  },
  {
    id: 'manage-clients',
    title: 'Client Management',
    description: 'Add or switch between clients',
    icon: Users,
    href: '/dashboard/clients',
    estimatedTime: '2 min'
  },
  {
    id: 'content-library',
    title: 'Content Library',
    description: 'Browse and manage existing content',
    icon: FileText,
    href: '/dashboard/content/library',
    estimatedTime: '1 min'
  }
]

interface MainFlowIntegrationProps {
  children: React.ReactNode
  className?: string
}

export default function MainFlowIntegration({ children, className = "" }: MainFlowIntegrationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentClient, currentCampaign, workflowStep, totalSteps } = useNavigation()
  
  const [flowState, setFlowState] = useState<FlowState>({
    currentFlow: 'dashboard',
    isTransitioning: false
  })
  
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [recentActions, setRecentActions] = useState<string[]>([])
  
  const contentWorkflow = useWorkflowIntegration('content-creation')
  const campaignWorkflow = useWorkflowIntegration('campaign-management')
  const clientWorkflow = useWorkflowIntegration('client-onboarding')

  // Detect current flow based on pathname
  useEffect(() => {
    let newFlow: FlowState['currentFlow'] = 'dashboard'
    
    if (pathname.includes('/content/generate') || pathname.includes('/ai-generation')) {
      newFlow = 'ai-generation'
    } else if (pathname.includes('/content')) {
      newFlow = 'content-creation'
    } else if (pathname.includes('/campaigns') || pathname.includes('/calendar')) {
      newFlow = 'campaign-management'
    } else if (pathname.includes('/clients')) {
      newFlow = 'client-management'
    }
    
    if (newFlow !== flowState.currentFlow) {
      setFlowState(prev => ({
        ...prev,
        previousFlow: prev.currentFlow,
        currentFlow: newFlow,
        isTransitioning: true
      }))
      
      // Reset transition state after animation
      setTimeout(() => {
        setFlowState(prev => ({ ...prev, isTransitioning: false }))
      }, 300)
    }
  }, [pathname, flowState.currentFlow])

  // Auto-show quick actions on dashboard
  useEffect(() => {
    setShowQuickActions(flowState.currentFlow === 'dashboard')
  }, [flowState.currentFlow])

  // Track recent actions
  const trackAction = useCallback((actionId: string) => {
    setRecentActions(prev => {
      const filtered = prev.filter(id => id !== actionId)
      return [actionId, ...filtered].slice(0, 3)
    })
  }, [])

  const handleQuickAction = useCallback((action: QuickAction) => {
    if (action.requiresClient && !currentClient) {
      toast.error('Please select a client first')
      router.push('/dashboard/clients')
      return
    }
    
    trackAction(action.id)
    
    // Start appropriate workflow
    if (action.id === 'generate-content') {
      contentWorkflow.startWorkflow({ clientId: currentClient?.id })
    } else if (action.id === 'manage-clients') {
      clientWorkflow.startWorkflow()
    }
    
    router.push(action.href)
  }, [currentClient, router, trackAction, contentWorkflow, clientWorkflow])

  const getFlowTitle = () => {
    switch (flowState.currentFlow) {
      case 'content-creation':
        return 'Content Creation'
      case 'campaign-management':
        return 'Campaign Management'
      case 'client-management':
        return 'Client Management'
      case 'ai-generation':
        return 'AI Content Generation'
      default:
        return 'Dashboard'
    }
  }

  const getFlowDescription = () => {
    switch (flowState.currentFlow) {
      case 'content-creation':
        return 'Create and manage your content library'
      case 'campaign-management':
        return 'Plan and execute marketing campaigns'
      case 'client-management':
        return 'Manage client profiles and branding'
      case 'ai-generation':
        return 'Generate content using AI assistance'
      default:
        return 'Your marketing command center'
    }
  }

  const isInWorkflow = workflowStep > 0 && totalSteps > 0

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Flow Header - Only show when not on dashboard */}
      <AnimatePresence>
        {flowState.currentFlow !== 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">
                      {getFlowTitle()}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {getFlowDescription()}
                    </p>
                  </div>
                </div>

                {/* Workflow Progress */}
                {isInWorkflow && (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-muted-foreground">
                      Step {workflowStep} of {totalSteps}
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(workflowStep / totalSteps) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Context Info */}
                <div className="flex items-center space-x-2">
                  {currentClient && (
                    <Badge variant="outline" className="text-xs">
                      {currentClient.brandName}
                    </Badge>
                  )}
                  {currentCampaign && (
                    <Badge variant="secondary" className="text-xs">
                      {currentCampaign.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Panel - Show on dashboard */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="container mx-auto px-4 py-6"
          >
            <Card className="border-0 bg-gradient-to-r from-primary-50 to-primary-100/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Home className="h-5 w-5 text-primary-600" />
                      <span>Quick Actions</span>
                    </CardTitle>
                    <CardDescription>
                      Jump into your most common workflows
                    </CardDescription>
                  </div>
                  
                  {currentClient && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        Active Client
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentClient.brandName}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {QUICK_ACTIONS.map((action) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          action.requiresClient && !currentClient 
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:border-primary-200'
                        }`}
                        onClick={() => handleQuickAction(action)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center
                              ${action.requiresClient && !currentClient
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary-100 text-primary-600'
                              }
                            `}>
                              <action.icon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex flex-col items-end space-y-1">
                              {action.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {action.badge}
                                </Badge>
                              )}
                              {recentActions.includes(action.id) && (
                                <Badge variant="outline" className="text-xs">
                                  Recent
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="font-semibold text-sm mb-1">
                            {action.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-3">
                            {action.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            {action.estimatedTime && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {action.estimatedTime}
                              </span>
                            )}
                            
                            <ChevronRight className={`h-4 w-4 ${
                              action.requiresClient && !currentClient
                                ? 'text-muted-foreground'
                                : 'text-primary-600'
                            }`} />
                          </div>
                          
                          {action.requiresClient && !currentClient && (
                            <div className="mt-2 text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded">
                              Requires client selection
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Flow Transitions */}
      <motion.div
        key={flowState.currentFlow}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        className="flex-1"
      >
        {children}
      </motion.div>

      {/* Flow Status Indicator */}
      <AnimatePresence>
        {flowState.isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="shadow-lg border-primary-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    Switching to {getFlowTitle()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Workflow Indicators */}
      <AnimatePresence>
        {(contentWorkflow.isActive || campaignWorkflow.isActive || clientWorkflow.isActive) && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 z-50"
          >
            <Card className="shadow-lg border-primary-200 bg-primary-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary-900">
                      Workflow Active
                    </div>
                    <div className="text-xs text-primary-700">
                      {contentWorkflow.isActive && 'Content Creation'}
                      {campaignWorkflow.isActive && 'Campaign Management'}
                      {clientWorkflow.isActive && 'Client Onboarding'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      contentWorkflow.endWorkflow()
                      campaignWorkflow.endWorkflow()
                      clientWorkflow.endWorkflow()
                    }}
                    className="h-6 w-6 p-0 text-primary-600 hover:text-primary-700"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Export integration hooks
export { useWorkflowIntegration } from './workflow-integration'

// Context provider for flow state
export function useFlowIntegration() {
  const [currentFlow, setCurrentFlow] = useState<string>('dashboard')
  const [flowData, setFlowData] = useState<any>({})
  
  const switchFlow = (flow: string, data?: any) => {
    setCurrentFlow(flow)
    if (data) setFlowData(data)
  }
  
  const resetFlow = () => {
    setCurrentFlow('dashboard')
    setFlowData({})
  }
  
  return {
    currentFlow,
    flowData,
    switchFlow,
    resetFlow
  }
}