'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigation } from '@/components/navigation/navigation-context'
import { toast } from 'sonner'
import { 
  Sparkles, 
  Calendar, 
  Users, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react'

interface WorkflowStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  status: 'completed' | 'current' | 'upcoming' | 'blocked'
  dependencies?: string[]
  estimatedTime?: string
}

interface WorkflowContext {
  clientId?: string
  campaignId?: string
  contentType?: string
  platform?: string
}

interface WorkflowIntegrationProps {
  workflowType: 'content-creation' | 'campaign-management' | 'client-onboarding'
  context?: WorkflowContext
  onStepComplete?: (stepId: string) => void
  onWorkflowComplete?: () => void
  className?: string
}

// Define main workflows
const WORKFLOWS = {
  'content-creation': [
    {
      id: 'client-selection',
      title: 'Select Client',
      description: 'Choose the client and brand context',
      icon: Users,
      href: '/dashboard/clients',
      estimatedTime: '1 min'
    },
    {
      id: 'content-generation',
      title: 'Generate Content',
      description: 'Use AI to create content ideas and copy',
      icon: Sparkles,
      href: '/dashboard/content/generate',
      dependencies: ['client-selection'],
      estimatedTime: '3-5 min'
    },
    {
      id: 'content-review',
      title: 'Review & Edit',
      description: 'Review generated content and make adjustments',
      icon: FileText,
      href: '/dashboard/content/library',
      dependencies: ['content-generation'],
      estimatedTime: '2-3 min'
    },
    {
      id: 'schedule-publication',
      title: 'Schedule Publication',
      description: 'Add content to publication calendar',
      icon: Calendar,
      href: '/dashboard/campaigns/calendar',
      dependencies: ['content-review'],
      estimatedTime: '1 min'
    }
  ],
  'campaign-management': [
    {
      id: 'campaign-setup',
      title: 'Campaign Setup',
      description: 'Define campaign goals and parameters',
      icon: Zap,
      href: '/dashboard/campaigns/new',
      estimatedTime: '5 min'
    },
    {
      id: 'content-planning',
      title: 'Content Planning',
      description: 'Plan content themes and schedule',
      icon: Calendar,
      href: '/dashboard/campaigns/calendar',
      dependencies: ['campaign-setup'],
      estimatedTime: '10 min'
    },
    {
      id: 'bulk-generation',
      title: 'Bulk Content Generation',
      description: 'Generate multiple content pieces',
      icon: Sparkles,
      href: '/dashboard/content/generate',
      dependencies: ['content-planning'],
      estimatedTime: '15-20 min'
    },
    {
      id: 'review-approval',
      title: 'Review & Approval',
      description: 'Review all generated content',
      icon: CheckCircle,
      href: '/dashboard/content/library',
      dependencies: ['bulk-generation'],
      estimatedTime: '10-15 min'
    }
  ],
  'client-onboarding': [
    {
      id: 'client-creation',
      title: 'Create Client Profile',
      description: 'Set up client information and branding',
      icon: Users,
      href: '/dashboard/clients/new',
      estimatedTime: '3 min'
    },
    {
      id: 'brand-assets',
      title: 'Upload Brand Assets',
      description: 'Add logos, colors, and brand guidelines',
      icon: FileText,
      href: '/dashboard/brand-assets',
      dependencies: ['client-creation'],
      estimatedTime: '5 min'
    },
    {
      id: 'first-content',
      title: 'Generate First Content',
      description: 'Create initial content to test the setup',
      icon: Sparkles,
      href: '/dashboard/content/generate',
      dependencies: ['brand-assets'],
      estimatedTime: '5 min'
    }
  ]
}

export default function WorkflowIntegration({
  workflowType,
  context,
  onStepComplete,
  onWorkflowComplete,
  className = ""
}: WorkflowIntegrationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentClient, currentCampaign, setWorkflowProgress } = useNavigation()
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])

  // Initialize workflow steps
  useEffect(() => {
    const steps = WORKFLOWS[workflowType].map(step => ({
      ...step,
      status: getStepStatus(step.id, completedSteps, currentStepIndex, step.dependencies)
    }))
    
    setWorkflowSteps(steps)
    setWorkflowProgress(currentStepIndex + 1, steps.length)
  }, [workflowType, completedSteps, currentStepIndex, setWorkflowProgress])

  // Update current step based on pathname
  useEffect(() => {
    const currentStep = workflowSteps.findIndex(step => 
      pathname.startsWith(step.href) || pathname === step.href
    )
    
    if (currentStep !== -1 && currentStep !== currentStepIndex) {
      setCurrentStepIndex(currentStep)
    }
  }, [pathname, workflowSteps, currentStepIndex])

  // Auto-detect completed steps based on context
  useEffect(() => {
    const newCompletedSteps: string[] = []

    // Client selection completed if we have a current client
    if (currentClient) {
      newCompletedSteps.push('client-selection', 'client-creation')
    }

    // Campaign setup completed if we have a current campaign
    if (currentCampaign) {
      newCompletedSteps.push('campaign-setup')
    }

    // Content generation completed if we have content context
    if (context?.contentType) {
      newCompletedSteps.push('content-generation', 'bulk-generation')
    }

    setCompletedSteps(prev => {
      const combined = [...new Set([...prev, ...newCompletedSteps])]
      return combined
    })
  }, [currentClient, currentCampaign, context])

  const getStepStatus = (
    stepId: string, 
    completed: string[], 
    currentIndex: number, 
    dependencies?: string[]
  ): WorkflowStep['status'] => {
    if (completed.includes(stepId)) {
      return 'completed'
    }

    const stepIndex = workflowSteps.findIndex(s => s.id === stepId)
    
    if (stepIndex === currentIndex) {
      return 'current'
    }

    // Check if dependencies are met
    if (dependencies) {
      const dependenciesMet = dependencies.every(dep => completed.includes(dep))
      if (!dependenciesMet) {
        return 'blocked'
      }
    }

    if (stepIndex < currentIndex) {
      return 'completed'
    }

    return 'upcoming'
  }

  const handleStepClick = useCallback((step: WorkflowStep) => {
    if (step.status === 'blocked') {
      toast.error('Complete previous steps first')
      return
    }

    // Navigate to step
    router.push(step.href)

    // Update current step
    const stepIndex = workflowSteps.findIndex(s => s.id === step.id)
    setCurrentStepIndex(stepIndex)
  }, [router, workflowSteps])

  const markStepComplete = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepId)) return prev
      const newCompleted = [...prev, stepId]
      
      onStepComplete?.(stepId)
      
      // Check if workflow is complete
      const allStepsCompleted = workflowSteps.every(step => 
        newCompleted.includes(step.id)
      )
      
      if (allStepsCompleted) {
        onWorkflowComplete?.()
        toast.success('Workflow completed successfully!')
      }
      
      return newCompleted
    })
  }, [workflowSteps, onStepComplete, onWorkflowComplete])

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'current':
        return <Clock className="h-5 w-5 text-primary-600 animate-pulse" />
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-neutral-400" />
      default:
        return <step.icon className="h-5 w-5 text-neutral-500" />
    }
  }

  const getStepStyles = (step: WorkflowStep) => {
    const baseStyles = "relative p-4 rounded-lg border transition-all duration-200 cursor-pointer"
    
    switch (step.status) {
      case 'completed':
        return `${baseStyles} bg-success-50 border-success-200 hover:bg-success-100`
      case 'current':
        return `${baseStyles} bg-primary-50 border-primary-200 shadow-md ring-2 ring-primary-100`
      case 'blocked':
        return `${baseStyles} bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed`
      default:
        return `${baseStyles} bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300`
    }
  }

  const calculateProgress = () => {
    return (completedSteps.length / workflowSteps.length) * 100
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Workflow Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 capitalize">
              {workflowType.replace('-', ' ')} Workflow
            </h2>
            <p className="text-neutral-600 mt-1">
              Follow these steps to complete your {workflowType.replace('-', ' ')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {completedSteps.length}/{workflowSteps.length}
            </div>
            <div className="text-sm text-neutral-600">Steps Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-600">
            <span>Start</span>
            <span>{Math.round(calculateProgress())}% Complete</span>
            <span>Finish</span>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={getStepStyles(step)}
            onClick={() => handleStepClick(step)}
          >
            <div className="flex items-center space-x-4">
              {/* Step Number & Icon */}
              <div className="flex items-center space-x-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${step.status === 'completed' 
                    ? 'bg-success-100 text-success-700' 
                    : step.status === 'current'
                    ? 'bg-primary-100 text-primary-700'
                    : step.status === 'blocked'
                    ? 'bg-neutral-100 text-neutral-400'
                    : 'bg-neutral-100 text-neutral-600'
                  }
                `}>
                  {step.status === 'completed' ? '✓' : index + 1}
                </div>
                {getStepIcon(step)}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${
                    step.status === 'blocked' ? 'text-neutral-400' : 'text-neutral-900'
                  }`}>
                    {step.title}
                  </h3>
                  {step.estimatedTime && (
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                      {step.estimatedTime}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${
                  step.status === 'blocked' ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                  {step.description}
                </p>

                {/* Dependencies */}
                {step.dependencies && step.status === 'blocked' && (
                  <div className="mt-2 text-xs text-neutral-500">
                    Requires: {step.dependencies.map(dep => {
                      const depStep = workflowSteps.find(s => s.id === dep)
                      return depStep?.title
                    }).join(', ')}
                  </div>
                )}
              </div>

              {/* Action Arrow */}
              {step.status !== 'blocked' && (
                <ArrowRight className={`h-5 w-5 ${
                  step.status === 'current' ? 'text-primary-600' : 'text-neutral-400'
                }`} />
              )}
            </div>

            {/* Current Step Indicator */}
            {step.status === 'current' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-b-lg"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Workflow Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-neutral-600">
          {completedSteps.length === workflowSteps.length 
            ? 'Workflow completed! 🎉'
            : `${workflowSteps.length - completedSteps.length} steps remaining`
          }
        </div>
        
        {currentStepIndex < workflowSteps.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const nextStep = workflowSteps[currentStepIndex + 1]
              if (nextStep && nextStep.status !== 'blocked') {
                handleStepClick(nextStep)
              }
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Continue to Next Step
          </motion.button>
        )}
      </div>
    </div>
  )
}

// Export workflow integration hook
export function useWorkflowIntegration(workflowType: WorkflowIntegrationProps['workflowType']) {
  const [isActive, setIsActive] = useState(false)
  const [context, setContext] = useState<WorkflowContext>({})
  
  const startWorkflow = (initialContext?: WorkflowContext) => {
    setIsActive(true)
    setContext(initialContext || {})
  }
  
  const endWorkflow = () => {
    setIsActive(false)
    setContext({})
  }
  
  const updateContext = (updates: Partial<WorkflowContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }
  
  return {
    isActive,
    context,
    startWorkflow,
    endWorkflow,
    updateContext
  }
}