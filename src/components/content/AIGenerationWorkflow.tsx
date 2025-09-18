'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Lightbulb, 
  FileText, 
  Image, 
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Coins,
  Timer,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface GenerationStep {
  step: 'IDEA_GENERATION' | 'COPY_DESIGN' | 'COPY_PUBLICATION' | 'BASE_IMAGE' | 'FINAL_DESIGN';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: any;
  tokensUsed: number;
  executedAt?: string;
  error?: string;
  estimatedTokens?: number;
  duration?: number;
}

interface ContentJob {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  tokensConsumed: number;
  estimatedTotalTokens: number;
  createdAt: string;
  completedAt?: string;
  steps: GenerationStep[];
  brandContext: any;
  cost?: number;
}

interface AIGenerationWorkflowProps {
  job?: ContentJob;
  onRegenerateStep?: (step: string) => void;
  onPauseGeneration?: () => void;
  onResumeGeneration?: () => void;
  className?: string;
}

export default function AIGenerationWorkflow({ 
  job, 
  onRegenerateStep, 
  onPauseGeneration, 
  onResumeGeneration,
  className = ""
}: AIGenerationWorkflowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (job) {
      const inProgressIndex = job.steps.findIndex(step => step.status === 'IN_PROGRESS');
      const lastCompletedIndex = job.steps.findLastIndex(step => step.status === 'COMPLETED');
      
      if (inProgressIndex !== -1) {
        setCurrentStepIndex(inProgressIndex);
      } else if (lastCompletedIndex !== -1) {
        setCurrentStepIndex(lastCompletedIndex);
      }
      
      setAnimationKey(prev => prev + 1);
    }
  }, [job]);

  const getStepIcon = (step: string) => {
    const iconMap = {
      'IDEA_GENERATION': Lightbulb,
      'COPY_DESIGN': FileText,
      'COPY_PUBLICATION': FileText,
      'BASE_IMAGE': Image,
      'FINAL_DESIGN': Sparkles
    };
    
    const IconComponent = iconMap[step as keyof typeof iconMap] || Sparkles;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStepTitle = (step: string) => {
    const titleMap = {
      'IDEA_GENERATION': 'Content Ideation',
      'COPY_DESIGN': 'Copy Creation',
      'COPY_PUBLICATION': 'Publication Copy',
      'BASE_IMAGE': 'Image Generation',
      'FINAL_DESIGN': 'Final Design'
    };
    
    return titleMap[step as keyof typeof titleMap] || step;
  };

  const getStepDescription = (step: string) => {
    const descriptionMap = {
      'IDEA_GENERATION': 'Generating creative concepts and ideas',
      'COPY_DESIGN': 'Crafting compelling copy for design',
      'COPY_PUBLICATION': 'Creating publication-ready content',
      'BASE_IMAGE': 'Generating base visual elements',
      'FINAL_DESIGN': 'Composing final design output'
    };
    
    return descriptionMap[step as keyof typeof descriptionMap] || 'Processing...';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'IN_PROGRESS':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'FAILED':
        return 'text-error-600 bg-error-50 border-error-200';
      default:
        return 'text-neutral-500 bg-neutral-50 border-neutral-200';
    }
  };

  const calculateProgress = () => {
    if (!job) return 0;
    
    const completedSteps = job.steps.filter(step => step.status === 'COMPLETED').length;
    const inProgressSteps = job.steps.filter(step => step.status === 'IN_PROGRESS').length;
    
    return ((completedSteps + (inProgressSteps * 0.5)) / job.steps.length) * 100;
  };

  const calculateTokenProgress = () => {
    if (!job) return 0;
    
    return (job.tokensConsumed / job.estimatedTotalTokens) * 100;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    
    return `${seconds}s`;
  };

  const estimatedCost = job ? (job.tokensConsumed * 0.002) : 0; // Rough estimate

  if (!job) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Ready to Generate</h3>
          <p className="text-sm text-neutral-600 text-center max-w-sm">
            Start a new AI generation to see the visual workflow timeline and progress tracking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Progress */}
      <Card className="border-0 bg-gradient-to-r from-primary-50 to-primary-100/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-neutral-900">
                AI Generation Workflow
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Track your content generation progress in real-time
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}
                className={`${
                  job.status === 'COMPLETED' 
                    ? 'bg-success-100 text-success-700 border-success-200' 
                    : job.status === 'IN_PROGRESS'
                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                {job.status.replace('_', ' ')}
              </Badge>
              {job.status === 'IN_PROGRESS' && onPauseGeneration && (
                <Button variant="outline" size="sm" onClick={onPauseGeneration}>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Overall Progress</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {Math.round(calculateProgress())}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={calculateProgress()} 
                  className="h-2 bg-neutral-200"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Token Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Coins className="h-4 w-4 text-warning-600" />
                  <span className="text-sm font-medium text-neutral-700">Tokens Used</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900">
                  {job.tokensConsumed.toLocaleString()} / {job.estimatedTotalTokens.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={calculateTokenProgress()} 
                  className="h-2 bg-warning-100"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-warning-400 to-warning-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateTokenProgress()}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Est. Cost: ${estimatedCost.toFixed(3)}</span>
                <span>{Math.round(calculateTokenProgress())}% of estimate</span>
              </div>
            </div>

            {/* Timing */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4 text-info-600" />
                <span className="text-sm font-medium text-neutral-700">Duration</span>
              </div>
              <div className="text-lg font-semibold text-neutral-900">
                {job.completedAt 
                  ? formatDuration(new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime())
                  : formatDuration(Date.now() - new Date(job.createdAt).getTime())
                }
              </div>
              <div className="text-xs text-neutral-600">
                Started {new Date(job.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <span>Generation Timeline</span>
          </CardTitle>
          <CardDescription>
            Visual representation of each generation step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200" />
            <motion.div
              className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-primary-500 to-primary-600"
              initial={{ height: 0 }}
              animate={{ 
                height: `${(job.steps.filter(s => s.status === 'COMPLETED').length / job.steps.length) * 100}%` 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Steps */}
            <div className="space-y-6">
              {job.steps.map((step, index) => (
                <motion.div
                  key={`${step.step}-${animationKey}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start space-x-4"
                >
                  {/* Step Icon */}
                  <div className={`
                    relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${getStatusColor(step.status)}
                    ${step.status === 'IN_PROGRESS' ? 'animate-pulse' : ''}
                  `}>
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.status === 'IN_PROGRESS' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock className="h-4 w-4" />
                      </motion.div>
                    ) : step.status === 'FAILED' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      getStepIcon(step.step)
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`
                      p-4 rounded-lg border transition-all duration-200
                      ${step.status === 'COMPLETED' 
                        ? 'bg-success-50 border-success-200 shadow-sm' 
                        : step.status === 'IN_PROGRESS'
                        ? 'bg-primary-50 border-primary-200 shadow-md'
                        : step.status === 'FAILED'
                        ? 'bg-error-50 border-error-200'
                        : 'bg-neutral-50 border-neutral-200'
                      }
                    `}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            {getStepTitle(step.step)}
                          </h4>
                          <p className="text-sm text-neutral-600">
                            {getStepDescription(step.step)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {step.status === 'FAILED' && onRegenerateStep && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRegenerateStep(step.step)}
                              className="text-error-600 border-error-200 hover:bg-error-50"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                          {step.status === 'COMPLETED' && step.output && (
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Step Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-500">Tokens Used</span>
                          <div className="font-medium text-neutral-900">
                            {step.tokensUsed > 0 ? step.tokensUsed.toLocaleString() : '--'}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Duration</span>
                          <div className="font-medium text-neutral-900">
                            {formatDuration(step.duration)}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Status</span>
                          <div className={`font-medium capitalize ${
                            step.status === 'COMPLETED' ? 'text-success-600' :
                            step.status === 'IN_PROGRESS' ? 'text-primary-600' :
                            step.status === 'FAILED' ? 'text-error-600' :
                            'text-neutral-500'
                          }`}>
                            {step.status.replace('_', ' ').toLowerCase()}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Completed</span>
                          <div className="font-medium text-neutral-900">
                            {step.executedAt 
                              ? new Date(step.executedAt).toLocaleTimeString()
                              : '--'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Error Message */}
                      {step.error && (
                        <div className="mt-3 p-2 bg-error-100 border border-error-200 rounded text-sm text-error-700">
                          {step.error}
                        </div>
                      )}

                      {/* Progress Animation for In-Progress Steps */}
                      {step.status === 'IN_PROGRESS' && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ 
                                  duration: 3, 
                                  repeat: Infinity, 
                                  ease: "easeInOut" 
                                }}
                              />
                            </div>
                            <Sparkles className="h-3 w-3 text-primary-600 animate-pulse" />
                          </div>
                          <p className="text-xs text-primary-600 animate-pulse">
                            Processing...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-warning-600" />
            <span>Token Usage Breakdown</span>
          </CardTitle>
          <CardDescription>
            Transparent view of AI resource consumption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {job.steps.map((step, index) => (
              <div key={step.step} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStepIcon(step.step)}
                  <div>
                    <p className="font-medium text-sm">{getStepTitle(step.step)}</p>
                    <p className="text-xs text-neutral-600">
                      {step.status === 'COMPLETED' ? 'Completed' : 
                       step.status === 'IN_PROGRESS' ? 'In Progress' : 
                       step.status === 'FAILED' ? 'Failed' : 'Pending'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {step.tokensUsed > 0 ? step.tokensUsed.toLocaleString() : '--'} tokens
                  </p>
                  <p className="text-xs text-neutral-600">
                    ${((step.tokensUsed || 0) * 0.002).toFixed(3)}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Usage</span>
                <div className="text-right">
                  <p>{job.tokensConsumed.toLocaleString()} tokens</p>
                  <p className="text-sm text-neutral-600">${estimatedCost.toFixed(3)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}