'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  Accessibility,
  Palette,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTourProgress } from '@/hooks/use-tour-progress'
import { getTourRegistry } from '@/lib/tour/tour-registry'
import type { TourDefinition } from '@/types/tour'

interface TourSettingsProps {
  className?: string
  onClose?: () => void
}

interface TourPreferences {
  autoStart: boolean
  showProgress: boolean
  allowKeyboardControl: boolean
  enableAnimations: boolean
  enableSounds: boolean
  enableNotifications: boolean
  tourFrequency: 'always' | 'once_per_session' | 'once_per_week' | 'never'
  preferredCategories: string[]
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    screenReaderOptimized: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
}

const defaultPreferences: TourPreferences = {
  autoStart: true,
  showProgress: true,
  allowKeyboardControl: true,
  enableAnimations: true,
  enableSounds: false,
  enableNotifications: true,
  tourFrequency: 'always',
  preferredCategories: [],
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
    fontSize: 'medium'
  }
}

const tourCategories = [
  { id: 'onboarding', name: 'Getting Started', description: 'Essential tours for new users' },
  { id: 'feature', name: 'Features', description: 'Learn specific functionality' },
  { id: 'contextual', name: 'Contextual Help', description: 'Page-specific guidance' },
  { id: 'help', name: 'Help & Support', description: 'Troubleshooting and tips' }
]

const frequencyOptions = [
  { value: 'always', label: 'Always show tours', description: 'Show tours every time they are triggered' },
  { value: 'once_per_session', label: 'Once per session', description: 'Show tours only once per browser session' },
  { value: 'once_per_week', label: 'Once per week', description: 'Show tours only once per week' },
  { value: 'never', label: 'Never', description: 'Disable all automatic tour triggers' }
]

export default function TourSettings({ className, onClose }: TourSettingsProps) {
  const [preferences, setPreferences] = useState<TourPreferences>(defaultPreferences)
  const [tourHistory, setTourHistory] = useState<Array<{ tourId: string; tour: TourDefinition; progress: any }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'preferences' | 'history' | 'data'>('preferences')

  const { loadAllProgress, resetProgress, updateProgress, progressData } = useTourProgress({ enablePersistence: true })

  // Load preferences and tour history
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load preferences from localStorage
        const savedPreferences = localStorage.getItem('tour-preferences')
        if (savedPreferences) {
          setPreferences({ ...defaultPreferences, ...JSON.parse(savedPreferences) })
        }

        // Load tour history
        await loadAllProgress()
        const registry = getTourRegistry()
        const history = []

        for (const progressItem of progressData) {
          try {
            const tour = await registry.loadTour(progressItem.tourId)
            history.push({ tourId: progressItem.tourId, tour, progress: progressItem })
          } catch (error) {
            console.warn(`Failed to load tour ${progressItem.tourId} for history:`, error)
          }
        }

        setTourHistory(history.sort((a, b) =>
          new Date(b.progress.lastInteractionAt).getTime() - new Date(a.progress.lastInteractionAt).getTime()
        ))
      } catch (error) {
        console.error('Failed to load tour settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [loadAllProgress, progressData])

  const savePreferences = async () => {
    setSaving(true)
    try {
      localStorage.setItem('tour-preferences', JSON.stringify(preferences))

      // Apply accessibility preferences immediately
      if (preferences.accessibility.highContrast) {
        document.documentElement.classList.add('high-contrast')
      } else {
        document.documentElement.classList.remove('high-contrast')
      }

      if (preferences.accessibility.reducedMotion) {
        document.documentElement.classList.add('reduce-motion')
      } else {
        document.documentElement.classList.remove('reduce-motion')
      }

      // Show success feedback
      setTimeout(() => setSaving(false), 1000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setSaving(false)
    }
  }

  const resetTourProgress = (tourId: string) => {
    const progressItem = tourHistory.find(item => item.tourId === tourId)
    if (progressItem) {
      resetProgress(progressItem.progress.userId, tourId)
      setTourHistory(prev => prev.filter(item => item.tourId !== tourId))
    }
  }

  const resetAllProgress = () => {
    tourHistory.forEach(item => resetProgress(item.progress.userId, item.tourId))
    setTourHistory([])
  }

  const exportData = async () => {
    const allProgress = await loadAllProgress()
    const data = {
      preferences,
      tourHistory: allProgress,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tour-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.preferences) {
          setPreferences({ ...defaultPreferences, ...data.preferences })
        }

        if (data.tourHistory) {
          Object.entries(data.tourHistory).forEach(([tourId, progress]) => {
            const progressData = progress as any
            if (progressData.userId) {
              updateProgress(progressData.userId, tourId, progressData)
            }
          })
        }

        // Reload tour history
        window.location.reload()
      } catch (error) {
        console.error('Failed to import data:', error)
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'skipped':
        return <Badge className="bg-yellow-100 text-yellow-800">Skipped</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tour Settings</h2>
          <p className="text-muted-foreground mt-1">
            Customize your tour experience and manage your progress
          </p>
        </div>

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'preferences', label: 'Preferences', icon: Settings },
          { id: 'history', label: 'History', icon: Clock },
          { id: 'data', label: 'Data', icon: Download }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* General Preferences */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">General Preferences</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-start tours</label>
                    <p className="text-xs text-muted-foreground">Automatically start tours when triggered</p>
                  </div>
                  <Button
                    variant={preferences.autoStart ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, autoStart: !prev.autoStart }))}
                  >
                    {preferences.autoStart ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Show progress indicators</label>
                    <p className="text-xs text-muted-foreground">Display progress bars and step counters</p>
                  </div>
                  <Button
                    variant={preferences.showProgress ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, showProgress: !prev.showProgress }))}
                  >
                    {preferences.showProgress ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Keyboard navigation</label>
                    <p className="text-xs text-muted-foreground">Allow keyboard control of tours</p>
                  </div>
                  <Button
                    variant={preferences.allowKeyboardControl ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, allowKeyboardControl: !prev.allowKeyboardControl }))}
                  >
                    {preferences.allowKeyboardControl ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Animations</label>
                    <p className="text-xs text-muted-foreground">Enable smooth transitions and animations</p>
                  </div>
                  <Button
                    variant={preferences.enableAnimations ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, enableAnimations: !prev.enableAnimations }))}
                  >
                    {preferences.enableAnimations ? <Zap className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Sound effects</label>
                    <p className="text-xs text-muted-foreground">Play sounds for tour interactions</p>
                  </div>
                  <Button
                    variant={preferences.enableSounds ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, enableSounds: !prev.enableSounds }))}
                  >
                    {preferences.enableSounds ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Notifications</label>
                    <p className="text-xs text-muted-foreground">Receive tour suggestions and updates</p>
                  </div>
                  <Button
                    variant={preferences.enableNotifications ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, enableNotifications: !prev.enableNotifications }))}
                  >
                    {preferences.enableNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tour Frequency */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tour Frequency</h3>

              <div className="space-y-3">
                {frequencyOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      preferences.tourFrequency === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setPreferences(prev => ({ ...prev, tourFrequency: option.value as any }))}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        preferences.tourFrequency === option.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Preferred Categories */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Preferred Categories</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select categories you're most interested in for personalized recommendations
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tourCategories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-colors",
                      preferences.preferredCategories.includes(category.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setPreferences(prev => ({
                        ...prev,
                        preferredCategories: prev.preferredCategories.includes(category.id)
                          ? prev.preferredCategories.filter(id => id !== category.id)
                          : [...prev.preferredCategories, category.id]
                      }))
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5",
                        preferences.preferredCategories.includes(category.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}>
                        {preferences.preferredCategories.includes(category.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Accessibility */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Accessibility className="w-5 h-5 mr-2" />
                Accessibility
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">High contrast mode</label>
                    <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
                  </div>
                  <Button
                    variant={preferences.accessibility.highContrast ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, highContrast: !prev.accessibility.highContrast }
                    }))}
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Reduced motion</label>
                    <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                  </div>
                  <Button
                    variant={preferences.accessibility.reducedMotion ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, reducedMotion: !prev.accessibility.reducedMotion }
                    }))}
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Screen reader optimized</label>
                    <p className="text-xs text-muted-foreground">Enhanced descriptions for screen readers</p>
                  </div>
                  <Button
                    variant={preferences.accessibility.screenReaderOptimized ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, screenReaderOptimized: !prev.accessibility.screenReaderOptimized }
                    }))}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Font size</label>
                  <div className="flex space-x-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <Button
                        key={size}
                        variant={preferences.accessibility.fontSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreferences(prev => ({
                          ...prev,
                          accessibility: { ...prev.accessibility, fontSize: size as any }
                        }))}
                        className="capitalize"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Tour History</h3>
                <p className="text-sm text-muted-foreground">
                  {tourHistory.length} tours in your history
                </p>
              </div>

              {tourHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllProgress}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {tourHistory.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tour history</h3>
                <p className="text-muted-foreground">
                  Start taking tours to see your progress here
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {tourHistory.map((item) => (
                  <Card key={item.tourId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(item.progress.status)}
                        <div>
                          <h4 className="font-medium">{item.tour.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last activity: {formatDate(item.progress.lastInteractionAt)}
                          </p>
                          {item.progress.status === 'in_progress' && (
                            <p className="text-xs text-muted-foreground">
                              Step {item.progress.currentStep + 1} of {item.tour.steps.length}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(item.progress.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetTourProgress(item.tourId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-2">Data Management</h3>
              <p className="text-sm text-muted-foreground">
                Export your tour data or import from a backup
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your preferences and tour progress as a JSON file
                </p>
                <Button onClick={exportData} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </Card>

              <Card className="p-6">
                <h4 className="font-medium mb-2 flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Restore your preferences and progress from a backup file
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Import tour data from JSON file"
                    title="Select a JSON file to import tour data"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="p-6 border-destructive/20">
              <h4 className="font-medium mb-2 flex items-center text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Data
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete all your tour preferences and progress. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all tour data? This cannot be undone.')) {
                    localStorage.removeItem('tour-preferences')
                    resetAllProgress()
                    setPreferences(defaultPreferences)
                    window.location.reload()
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset All Data
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}