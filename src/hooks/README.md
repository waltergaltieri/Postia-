# Tour Management Hooks

This directory contains the tour management hooks for the Driver.js onboarding system. These hooks provide comprehensive tour control, progress tracking, and intelligent tour suggestions.

## Overview

The tour management system consists of three main hooks that work together to provide a complete onboarding experience:

1. **`useTour`** - Main tour control and state management
2. **`useTourProgress`** - Progress tracking and analytics
3. **`useContextualTours`** - Intelligent tour suggestions based on user behavior

## Hooks

### useTour

The main hook for tour control that implements requirements 1.1, 1.3, 7.3, and 7.4.

```typescript
import { useTour } from '@/hooks/use-tour'

const {
  // State
  currentTour,
  currentStep,
  totalSteps,
  isActive,
  isLoading,
  error,
  userPreferences,
  
  // Actions
  startTour,
  stopTour,
  nextStep,
  previousStep,
  skipTour,
  resetTourProgress,
  
  // Utilities
  getTourStatus,
  shouldShowTour,
  saveUserPreferences
} = useTour({
  enableAnalytics: true,
  autoSaveProgress: true,
  onTourComplete: (tourId) => console.log('Tour completed:', tourId)
})
```

**Features:**
- Tour state management and monitoring
- User preferences integration
- Progress persistence
- Analytics tracking
- Error handling and recovery
- Accessibility support integration

**Convenience Hooks:**
- `useTourState()` - Just the state values
- `useTourControls()` - Just the control functions
- `useTourPreferences()` - Just the preferences management

### useTourProgress

Hook for tracking and persisting tour progress that implements requirements 1.4, 7.3, and 8.1.

```typescript
import { useTourProgress } from '@/hooks/use-tour-progress'

const {
  // State
  progressData,
  analyticsData,
  isLoading,
  error,
  
  // Progress management
  loadProgress,
  saveProgress,
  updateProgress,
  resetProgress,
  
  // Tour lifecycle
  startTourProgress,
  completeStep,
  completeTour,
  skipTour,
  
  // Analytics
  trackAnalyticsEvent,
  calculateMetrics,
  getCompletionStats,
  
  // Utilities
  restoreInterruptedTour,
  syncProgressData
} = useTourProgress({
  enableAnalytics: true,
  enablePersistence: true,
  syncInterval: 30000
})
```

**Features:**
- Progress tracking and persistence
- Completion status management
- Analytics and metrics collection
- Progress restoration for interrupted tours
- Automatic data synchronization
- Performance metrics calculation

**Convenience Hooks:**
- `useTourProgressTracker(userId, tourId)` - Focused progress tracking
- `useTourAnalytics(userId, tourId)` - Analytics-focused tracking

### useContextualTours

Hook for intelligent tour suggestions that implements requirements 8.1, 8.2, 8.3, and 8.4.

```typescript
import { useContextualTours } from '@/hooks/use-contextual-tours'

const {
  // State
  userActivity,
  suggestions,
  activeSuggestion,
  suggestionsShownThisSession,
  
  // Actions
  trackFeatureUsage,
  trackError,
  acceptSuggestion,
  dismissSuggestion,
  
  // Analysis
  analyzeUserBehavior,
  detectPageContext,
  checkForNewFeatures
} = useContextualTours({
  enableBehaviorTracking: true,
  enableInactivityDetection: true,
  enableErrorTracking: true,
  enableFeatureDiscovery: true,
  inactivityThreshold: 30000,
  errorThreshold: 3,
  maxSuggestionsPerSession: 3
})
```

**Features:**
- Behavior-based tour triggering
- Page context detection
- User activity monitoring
- Proactive tour suggestions
- Error pattern detection
- Feature discovery suggestions
- Inactivity detection

**Convenience Hooks:**
- `useSimpleContextualTours()` - Basic contextual suggestions
- `useBehaviorBasedTours()` - Behavior analysis focused

## Usage Examples

### Basic Tour Control

```typescript
function TourButton() {
  const { startTour, isActive, currentTour } = useTour()
  
  const handleStartTour = () => {
    startTour('welcome-tour', {
      autoStart: true,
      onComplete: () => console.log('Welcome tour completed!')
    })
  }
  
  return (
    <button onClick={handleStartTour} disabled={isActive}>
      {isActive ? `Active: ${currentTour}` : 'Start Tour'}
    </button>
  )
}
```

### Progress Tracking

```typescript
function TourProgress() {
  const { progress, metrics } = useTourProgressTracker('user-1', 'welcome-tour')
  
  return (
    <div>
      <p>Progress: {progress?.currentStep || 0} / {progress?.completedSteps.length || 0}</p>
      <p>Completion Rate: {metrics?.completionRate || 0}%</p>
    </div>
  )
}
```

### Contextual Suggestions

```typescript
function ContextualTourSuggestion() {
  const { suggestion, acceptSuggestion, dismissSuggestion } = useSimpleContextualTours()
  
  if (!suggestion) return null
  
  return (
    <div className="tour-suggestion">
      <p>{suggestion.message}</p>
      <button onClick={() => acceptSuggestion(suggestion)}>
        Start Tour
      </button>
      <button onClick={() => dismissSuggestion(suggestion)}>
        Dismiss
      </button>
    </div>
  )
}
```

### Complete Integration

```typescript
function TourManager() {
  const tour = useTour({ enableAnalytics: true })
  const progress = useTourProgress({ enablePersistence: true })
  const contextual = useContextualTours()
  
  // Restore interrupted tour on mount
  useEffect(() => {
    const restoreTour = async () => {
      const interrupted = await progress.restoreInterruptedTour('current-user')
      if (interrupted) {
        await tour.startTour(interrupted.tourId)
      }
    }
    restoreTour()
  }, [])
  
  // Track feature usage
  const handleFeatureUse = (feature: string) => {
    contextual.trackFeatureUsage(feature)
  }
  
  return (
    <div>
      {/* Tour controls */}
      {/* Progress display */}
      {/* Contextual suggestions */}
    </div>
  )
}
```

## Configuration

### User Preferences

```typescript
interface UserPreferences {
  autoStartTours: boolean
  showProgress: boolean
  enableKeyboardNavigation: boolean
  enableScreenReaderSupport: boolean
  tourFrequency: 'always' | 'once' | 'never'
  completedTours: string[]
  skippedTours: string[]
}
```

### Analytics Configuration

```typescript
interface UseTourProgressConfig {
  enableAnalytics?: boolean
  enablePersistence?: boolean
  syncInterval?: number
  onProgressUpdate?: (progress: UserTourProgress) => void
  onAnalyticsUpdate?: (analytics: TourAnalytics) => void
}
```

### Contextual Tours Configuration

```typescript
interface UseContextualToursConfig {
  enableBehaviorTracking?: boolean
  enableInactivityDetection?: boolean
  enableErrorTracking?: boolean
  enableFeatureDiscovery?: boolean
  inactivityThreshold?: number
  errorThreshold?: number
  suggestionCooldown?: number
  maxSuggestionsPerSession?: number
}
```

## Requirements Satisfied

- **1.1**: Tour state management and monitoring ✅
- **1.3**: User preferences integration ✅
- **1.4**: Progress tracking and restoration ✅
- **7.3**: Tour progress persistence ✅
- **7.4**: User settings integration ✅
- **8.1**: Behavior-based tour triggering ✅
- **8.2**: Page context detection ✅
- **8.3**: User activity monitoring ✅
- **8.4**: Proactive tour suggestions ✅

## Testing

Run the validation script to verify the hooks are working correctly:

```bash
npx tsx src/hooks/__tests__/simple-validation.ts
```

## Integration

These hooks integrate with:
- **TourProvider**: Main context provider for tour state
- **Driver.js**: Core tour engine
- **Accessibility system**: Screen reader support and keyboard navigation
- **Analytics system**: Event tracking and metrics
- **Navigation context**: Page and client context detection
- **Local storage**: Progress and preferences persistence

## Next Steps

After implementing these hooks, you can:
1. Create predefined tour configurations (Task 6)
2. Implement tour analytics and tracking system (Task 7)
3. Add intelligent tour triggering system (Task 8)
4. Create tour management interface (Task 9)
5. Add mobile-specific optimizations (Task 10)