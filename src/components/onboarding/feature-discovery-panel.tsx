'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Lightbulb, 
  Star, 
  Clock, 
  ChevronRight, 
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'
import { useFeatureDiscovery } from '@/hooks/use-feature-discovery'
import type { FeatureDiscoveryRecommendation } from '@/lib/tour/discovery/feature-discovery-engine'

/**
 * Props for FeatureDiscoveryPanel component
 */
export interface FeatureDiscoveryPanelProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showWhatsNew?: boolean
  maxRecommendations?: number
  onRecommendationAccepted?: (recommendation: FeatureDiscoveryRecommendation) => void
  onRecommendationDismissed?: (recommendation: FeatureDiscoveryRecommendation, reason?: string) => void
}

/**
 * Feature discovery panel component
 * Shows personalized feature recommendations and what's new items
 */
export function FeatureDiscoveryPanel({
  className = '',
  position = 'bottom-right',
  showWhatsNew = true,
  maxRecommendations = 3,
  onRecommendationAccepted,
  onRecommendationDismissed
}: FeatureDiscoveryPanelProps) {
  const {
    recommendations,
    activeRecommendation,
    whatsNewItems,
    unreadWhatsNewCount,
    acceptRecommendation,
    dismissRecommendation,
    markWhatsNewAsRead
  } = useFeatureDiscovery()

  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'recommendations' | 'whats-new'>('recommendations')

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  // Animation variants
  const panelVariants = {
    collapsed: {
      width: 'auto',
      height: 'auto',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    expanded: {
      width: 400,
      height: 500,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2, delay: 0.1 }
    }
  }

  // Handle recommendation acceptance
  const handleAcceptRecommendation = async (recommendation: FeatureDiscoveryRecommendation) => {
    const success = await acceptRecommendation(recommendation.featureId)
    if (success) {
      onRecommendationAccepted?.(recommendation)
      setIsExpanded(false)
    }
  }

  // Handle recommendation dismissal
  const handleDismissRecommendation = (recommendation: FeatureDiscoveryRecommendation, reason?: string) => {
    dismissRecommendation(recommendation.featureId, reason)
    onRecommendationDismissed?.(recommendation, reason)
  }

  // Get icon for recommendation reason
  const getRecommendationIcon = (reason: FeatureDiscoveryRecommendation['reason']) => {
    switch (reason) {
      case 'unused_feature':
        return <Lightbulb className="w-4 h-4" />
      case 'related_feature':
        return <TrendingUp className="w-4 h-4" />
      case 'new_feature':
        return <Sparkles className="w-4 h-4" />
      case 'upgrade_opportunity':
        return <Star className="w-4 h-4" />
      case 'workflow_optimization':
        return <Zap className="w-4 h-4" />
      default:
        return <Lightbulb className="w-4 h-4" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Show notification badge if there are recommendations or unread what's new
  const hasNotifications = recommendations.length > 0 || (showWhatsNew && unreadWhatsNewCount > 0)
  const notificationCount = recommendations.length + (showWhatsNew ? unreadWhatsNewCount : 0)

  if (!hasNotifications && !activeRecommendation) {
    return null
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]} ${className}`}>
      <motion.div
        variants={panelVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        className="relative"
      >
        <Card className="shadow-lg border-2 bg-white/95 backdrop-blur-sm">
          {!isExpanded ? (
            // Collapsed state - notification badge
            <motion.div
              className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsExpanded(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Lightbulb className="w-6 h-6 text-blue-600" />
                  {notificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Descubre nuevas funciones
                </span>
              </div>
            </motion.div>
          ) : (
            // Expanded state - full panel
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Descubrimiento</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'recommendations'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  Recomendaciones
                  {recommendations.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {recommendations.length}
                    </Badge>
                  )}
                </button>
                {showWhatsNew && (
                  <button
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'whats-new'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('whats-new')}
                  >
                    Novedades
                    {unreadWhatsNewCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadWhatsNewCount}
                      </Badge>
                    )}
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="h-80 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'recommendations' ? (
                    <motion.div
                      key="recommendations"
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-3"
                    >
                      {recommendations.slice(0, maxRecommendations).map((recommendation) => (
                        <RecommendationCard
                          key={recommendation.featureId}
                          recommendation={recommendation}
                          onAccept={() => handleAcceptRecommendation(recommendation)}
                          onDismiss={(reason) => handleDismissRecommendation(recommendation, reason)}
                          getIcon={getRecommendationIcon}
                          getPriorityColor={getPriorityColor}
                        />
                      ))}
                      
                      {recommendations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No hay recomendaciones nuevas</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Sigue usando la plataforma para recibir sugerencias personalizadas
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="whats-new"
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-3"
                    >
                      {whatsNewItems.map((item) => (
                        <WhatsNewCard
                          key={item.id}
                          item={item}
                          isRead={false} // You would track this
                          onMarkAsRead={() => markWhatsNewAsRead(item.id)}
                        />
                      ))}
                      
                      {whatsNewItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No hay novedades recientes</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Te notificaremos cuando haya nuevas funciones
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

/**
 * Individual recommendation card component
 */
interface RecommendationCardProps {
  recommendation: FeatureDiscoveryRecommendation
  onAccept: () => void
  onDismiss: (reason?: string) => void
  getIcon: (reason: FeatureDiscoveryRecommendation['reason']) => React.ReactNode
  getPriorityColor: (priority: string) => string
}

function RecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  getIcon,
  getPriorityColor
}: RecommendationCardProps) {
  const [showDismissOptions, setShowDismissOptions] = useState(false)

  const dismissOptions = [
    { value: 'not_interested', label: 'No me interesa' },
    { value: 'already_know', label: 'Ya lo conozco' },
    { value: 'too_advanced', label: 'Muy avanzado' },
    { value: 'not_relevant', label: 'No es relevante' }
  ]

  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon(recommendation.reason)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {recommendation.title}
            </h4>
            <Badge 
              variant="outline" 
              className={`text-xs ${getPriorityColor(recommendation.priority)}`}
            >
              {recommendation.priority}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {recommendation.message}
          </p>
          
          {recommendation.benefits.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Beneficios:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {recommendation.benefits.slice(0, 2).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                    <span className="line-clamp-1">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Confianza: {Math.round(recommendation.confidence * 100)}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              {!showDismissOptions ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDismissOptions(true)}
                    className="h-7 px-2 text-xs"
                  >
                    Descartar
                  </Button>
                  <Button
                    size="sm"
                    onClick={onAccept}
                    className="h-7 px-3 text-xs"
                  >
                    Ver tour
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  {dismissOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDismiss(option.value)}
                      className="text-xs text-gray-600 hover:text-gray-900 text-left"
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowDismissOptions(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 text-left"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * What's new card component
 */
interface WhatsNewCardProps {
  item: any // WhatsNewItem type
  isRead: boolean
  onMarkAsRead: () => void
}

function WhatsNewCard({ item, isRead, onMarkAsRead }: WhatsNewCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-4 h-4 text-green-600" />
      case 'improvement':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'fix':
        return <Zap className="w-4 h-4 text-orange-600" />
      case 'announcement':
        return <Users className="w-4 h-4 text-purple-600" />
      default:
        return <Sparkles className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'improvement':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fix':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'announcement':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card 
      className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
        !isRead ? 'border-blue-200 bg-blue-50/50' : ''
      }`}
      onClick={onMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(item.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {item.title}
            </h4>
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeColor(item.type)}`}
            >
              {item.type}
            </Badge>
            {!isRead && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {item.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(item.publishDate).toLocaleDateString()}</span>
            </div>
            
            {item.tourId && (
              <Badge variant="outline" className="text-xs">
                Tour disponible
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}