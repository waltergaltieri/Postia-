'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useNavigation } from '@/components/navigation/navigation-context'
import WorkflowIntegration from '@/components/integration/workflow-integration'
import { ContextAwarePage, StaggeredChildren, StaggeredItem } from '@/components/integration/page-transitions'
import { ContentGrid } from '@/components/dashboard/content-grid'
import AIGenerationWorkflow from '@/components/content/AIGenerationWorkflow'
import { CalendarView } from '@/components/calendar/calendar-view'
import ClientBrandSwitcher from '@/components/client/client-brand-switcher'
import { 
  Sparkles, 
  Calendar, 
  Users, 
  FileText, 
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Settings,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

// Mock data for demonstration
const mockContentItems = [
  {
    id: '1',
    title: 'Summer Campaign Post 1',
    description: 'Engaging social media post for summer campaign',
    thumbnail: '/api/placeholder/300/200',
    status: 'approved' as const,
    contentType: 'image' as const,
    platform: 'instagram',
    createdAt: '2024-01-15',
    tags: ['summer', 'campaign', 'social']
  },
  {
    id: '2',
    title: 'Product Launch Video',
    description: 'Promotional video for new product launch',
    thumbnail: '/api/placeholder/300/250',
    status: 'pending' as const,
    contentType: 'video' as const,
    platform: 'facebook',
    createdAt: '2024-01-14',
    tags: ['product', 'launch', 'video']
  },
  {
    id: '3',
    title: 'Brand Story Article',
    description: 'Long-form content about brand values',
    status: 'draft' as const,
    contentType: 'text' as const,
    platform: 'linkedin',
    createdAt: '2024-01-13',
    tags: ['brand', 'story', 'values']
  }
]

const mockAIJob = {
  id: 'job-123',
  status: 'IN_PROGRESS' as const,
  tokensConsumed: 1250,
  estimatedTotalTokens: 2000,
  createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
  steps: [
    {
      step: 'IDEA_GENERATION' as const,
      status: 'COMPLETED' as const,
      output: { ideas: ['Summer vibes', 'Beach lifestyle', 'Vacation mood'] },
      tokensUsed: 300,
      executedAt: new Date(Date.now() - 100000).toISOString(),
      duration: 15000
    },
    {
      step: 'COPY_DESIGN' as const,
      status: 'COMPLETED' as const,
      output: { copy: 'Embrace the summer vibes with our latest collection...' },
      tokensUsed: 450,
      executedAt: new Date(Date.now() - 80000).toISOString(),
      duration: 20000
    },
    {
      step: 'BASE_IMAGE' as const,
      status: 'IN_PROGRESS' as const,
      output: null,
      tokensUsed: 500,
      duration: 25000
    },
    {
      step: 'FINAL_DESIGN' as const,
      status: 'PENDING' as const,
      output: null,
      tokensUsed: 0
    }
  ],
  brandContext: {}
}

const mockCalendarEvents = [
  {
    id: '1',
    title: 'Summer Campaign Launch',
    date: new Date(2024, 5, 15),
    status: 'scheduled' as const,
    platform: 'instagram',
    contentType: 'image'
  },
  {
    id: '2',
    title: 'Product Announcement',
    date: new Date(2024, 5, 18),
    status: 'draft' as const,
    platform: 'facebook',
    contentType: 'video'
  },
  {
    id: '3',
    title: 'Brand Story Article',
    date: new Date(2024, 5, 22),
    status: 'approved' as const,
    platform: 'linkedin',
    contentType: 'text'
  }
]

export default function IntegrationDemoPage() {
  const { currentClient, clients, setCurrentClient } = useNavigation()
  const [activeDemo, setActiveDemo] = useState<string>('overview')
  const [contentFilters, setContentFilters] = useState({
    search: '',
    status: [],
    contentType: [],
    platform: [],
    dateRange: {}
  })

  // Simulate workflow progress
  const [workflowProgress, setWorkflowProgress] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkflowProgress(prev => {
        if (prev >= 100) return 0
        return prev + 10
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleContentAction = (itemId: string, action: string) => {
    toast.success(`${action} action triggered for content ${itemId}`)
  }

  const handleBulkAction = (actionId: string, selectedIds: string[]) => {
    toast.success(`Bulk ${actionId} applied to ${selectedIds.length} items`)
  }

  const handleStepComplete = (stepId: string) => {
    toast.success(`Workflow step "${stepId}" completed`)
  }

  const handleWorkflowComplete = () => {
    toast.success('Workflow completed successfully! 🎉')
  }

  const demoSections = [
    {
      id: 'overview',
      title: 'Integration Overview',
      description: 'See how all components work together',
      icon: BarChart3
    },
    {
      id: 'workflow',
      title: 'Workflow Integration',
      description: 'Step-by-step process flows',
      icon: Zap
    },
    {
      id: 'content-grid',
      title: 'Content Management',
      description: 'Unified content grid with actions',
      icon: FileText
    },
    {
      id: 'ai-generation',
      title: 'AI Generation Flow',
      description: 'Real-time AI workflow tracking',
      icon: Sparkles
    },
    {
      id: 'calendar',
      title: 'Calendar Integration',
      description: 'Publication scheduling system',
      icon: Calendar
    },
    {
      id: 'client-branding',
      title: 'Client Context',
      description: 'Dynamic branding and context switching',
      icon: Users
    }
  ]

  return (
    <ContextAwarePage className="container mx-auto px-4 py-6 space-y-8">
      <StaggeredChildren>
        {/* Header */}
        <StaggeredItem>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center"
            >
              <Zap className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Complete UI/UX Integration
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the seamless integration of navigation, content management, AI generation, 
              and workflow systems in a unified interface.
            </p>
          </div>
        </StaggeredItem>

        {/* Integration Status */}
        <StaggeredItem>
          <Card className="border-0 bg-gradient-to-r from-success-50 to-success-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-success-900">
                      Integration Complete
                    </h3>
                    <p className="text-success-700">
                      All components are connected and working together seamlessly
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success-600">100%</div>
                  <div className="text-sm text-success-700">Components Integrated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggeredItem>

        {/* Demo Navigation */}
        <StaggeredItem>
          <Card>
            <CardHeader>
              <CardTitle>Interactive Demonstrations</CardTitle>
              <CardDescription>
                Explore different aspects of the integrated system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {demoSections.map((section) => (
                  <motion.div
                    key={section.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${
                        activeDemo === section.id 
                          ? 'border-primary-200 bg-primary-50' 
                          : 'hover:border-primary-100 hover:bg-primary-25'
                      }`}
                      onClick={() => setActiveDemo(section.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${activeDemo === section.id 
                              ? 'bg-primary-100 text-primary-600' 
                              : 'bg-muted text-muted-foreground'
                            }
                          `}>
                            <section.icon className="h-4 w-4" />
                          </div>
                          <h4 className="font-semibold text-sm">{section.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </StaggeredItem>

        {/* Demo Content */}
        <StaggeredItem>
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeDemo === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      <span>System Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Component Load Time</span>
                        <Badge variant="secondary">&lt; 100ms</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Navigation Smoothness</span>
                        <Badge variant="secondary">60 FPS</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Memory Usage</span>
                        <Badge variant="secondary">Optimized</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary-600" />
                      <span>Active Context</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Current Client</span>
                        <div className="font-medium">
                          {currentClient?.brandName || 'No client selected'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Available Clients</span>
                        <div className="font-medium">{clients.length} clients</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-primary-600" />
                      <span>Workflow Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Progress</span>
                        <span className="font-medium">{workflowProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div
                          className="bg-primary h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${workflowProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeDemo === 'workflow' && (
              <WorkflowIntegration
                workflowType="content-creation"
                onStepComplete={handleStepComplete}
                onWorkflowComplete={handleWorkflowComplete}
              />
            )}

            {activeDemo === 'content-grid' && (
              <ContentGrid
                items={mockContentItems}
                filters={contentFilters}
                onFiltersChange={setContentFilters}
                onItemAction={handleContentAction}
                onBulkAction={handleBulkAction}
                bulkActions={[
                  { id: 'approve', label: 'Approve Selected', icon: CheckCircle },
                  { id: 'schedule', label: 'Schedule', icon: Calendar },
                  { id: 'delete', label: 'Delete', icon: FileText, variant: 'destructive' }
                ]}
              />
            )}

            {activeDemo === 'ai-generation' && (
              <AIGenerationWorkflow
                job={mockAIJob}
                onRegenerateStep={(step) => toast.info(`Regenerating ${step}`)}
                onPauseGeneration={() => toast.info('Generation paused')}
                onResumeGeneration={() => toast.info('Generation resumed')}
              />
            )}

            {activeDemo === 'calendar' && (
              <CalendarView
                events={mockCalendarEvents}
                onEventClick={(event) => toast.info(`Clicked event: ${event.title}`)}
                onDateClick={(date) => toast.info(`Clicked date: ${date.toDateString()}`)}
                onEventDrop={(eventId, newDate) => 
                  toast.success(`Event ${eventId} moved to ${newDate.toDateString()}`)
                }
              />
            )}

            {activeDemo === 'client-branding' && (
              <div className="space-y-6">
                <ClientBrandSwitcher
                  currentClient={currentClient}
                  clients={clients}
                  onClientChange={(client) => {
                    setCurrentClient(client)
                    toast.success(`Switched to ${client.brandName}`)
                  }}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Dynamic Branding Demo</CardTitle>
                    <CardDescription>
                      See how the interface adapts to different client brands
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clients.slice(0, 4).map((client) => (
                        <Card 
                          key={client.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            currentClient?.id === client.id 
                              ? 'border-primary-200 bg-primary-50' 
                              : 'hover:border-primary-100'
                          }`}
                          onClick={() => setCurrentClient(client)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: client.brandColors[0] }}
                              >
                                {client.brandName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold">{client.brandName}</h4>
                                <div className="flex space-x-1 mt-1">
                                  {client.brandColors.slice(0, 3).map((color, index) => (
                                    <div
                                      key={index}
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </StaggeredItem>

        {/* Integration Summary */}
        <StaggeredItem>
          <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <span>Integration Benefits</span>
              </CardTitle>
              <CardDescription>
                Key advantages of the unified system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Seamless Navigation</h4>
                      <p className="text-sm text-muted-foreground">
                        Smooth transitions between different contexts and workflows
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Context Awareness</h4>
                      <p className="text-sm text-muted-foreground">
                        Components automatically adapt to current client and campaign
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Unified State Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Consistent data flow across all components
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Workflow Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        Step-by-step guidance through complex processes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Performance Optimized</h4>
                      <p className="text-sm text-muted-foreground">
                        Lazy loading and efficient rendering for smooth experience
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Mobile Responsive</h4>
                      <p className="text-sm text-muted-foreground">
                        Consistent experience across all device sizes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggeredItem>
      </StaggeredChildren>
    </ContextAwarePage>
  )
}