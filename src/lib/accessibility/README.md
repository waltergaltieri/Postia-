# Tour Accessibility Implementation

This directory contains comprehensive accessibility features for the Driver.js onboarding system, ensuring WCAG 2.1 AA compliance and enhanced user experience for users with disabilities.

## Features Implemented

### 4.1 Comprehensive Keyboard Navigation Support ✅

- **Focus Trap Management**: Implemented `useFocusTrap` hook that traps focus within tour components during active tours
- **Keyboard Shortcuts**: Full keyboard navigation support with standardized shortcuts:
  - `Arrow Left/Right`: Navigate between tour steps
  - `Escape`: Close tour
  - `Space`: Pause/resume tour
  - `Home`: Restart tour
  - `End`: Skip tour
  - `Tab/Shift+Tab`: Navigate between focusable elements
- **Focus Restoration**: Automatically saves and restores focus when tours start/end
- **Enhanced Navigation**: `useKeyboardNavigation` hook provides comprehensive keyboard event handling

### 4.2 Screen Reader Support and ARIA Integration ✅

- **Live Region Announcements**: Automatic announcements for tour progress and state changes
- **Comprehensive ARIA Attributes**: 
  - `aria-label`, `aria-describedby`, `aria-current`, `aria-setsize`, `aria-posinset`
  - `role="dialog"`, `aria-modal="true"` for tour popovers
  - `role="progressbar"` with proper value attributes
- **Screen Reader Optimized Descriptions**: Context-aware descriptions that include:
  - Current step information
  - Available navigation options
  - Keyboard shortcuts
  - Progress indicators
- **Smart Announcements**: 
  - Tour start/completion announcements
  - Step change notifications
  - Error and skip notifications
  - Keyboard shortcut instructions

### 4.3 High Contrast and Reduced Motion Support ✅

- **High Contrast Mode Detection**: `useHighContrast` hook detects user preferences
- **WCAG Compliant Color Schemes**: 
  - High contrast color palettes for light and dark themes
  - Enhanced border widths and outline styles
  - Focus indicators with sufficient contrast ratios
- **Reduced Motion Support**: `useReducedMotion` hook respects user preferences
- **Motion-Safe Animations**: 
  - Conditional animation variants
  - Automatic animation disabling for reduced motion users
  - Motion-safe scroll behavior
- **CSS Media Query Integration**: Proper `@media (prefers-reduced-motion)` and `@media (prefers-contrast: high)` support

## Core Components

### Accessibility Hooks

- `useKeyboardNavigation`: Comprehensive keyboard event handling
- `useFocusTrap`: Focus management and trapping
- `useReducedMotion`: Motion preference detection
- `useHighContrast`: High contrast preference detection
- `useTourAccessibility`: Main accessibility manager for tours
- `useScreenReaderAnnouncements`: Screen reader announcement management

### Screen Reader Support

- `announceToScreenReader`: Direct screen reader announcements
- `createAriaAttributes`: Generate proper ARIA attributes
- `generateScreenReaderDescription`: Context-aware descriptions
- `TourLiveRegion`: Dedicated live region component
- `TourAriaDescription`: Comprehensive ARIA description provider

### Accessibility Testing

- `checkTourWCAGCompliance`: Automated WCAG compliance checking
- `TourAccessibilityTest`: Visual compliance testing component
- `generateAccessibilityReport`: Detailed accessibility reports

## WCAG 2.1 Compliance

### Level AA Compliance ✅

- **1.4.3 Contrast (Minimum)**: Color contrast ratios meet 4.5:1 standard
- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap**: Focus can be moved away from components
- **2.4.3 Focus Order**: Logical focus order maintained
- **2.4.7 Focus Visible**: Clear focus indicators provided
- **3.2.1 On Focus**: No context changes on focus
- **4.1.2 Name, Role, Value**: Proper ARIA implementation

### Level AAA Features ✅

- **1.4.6 Contrast (Enhanced)**: 7:1 contrast ratio support in high contrast mode
- **2.2.3 No Timing**: No time limits on tour interactions
- **2.3.3 Animation from Interactions**: Respects reduced motion preferences
- **2.4.8 Location**: Clear indication of current step and progress

## Usage Examples

### Basic Accessibility Setup

```tsx
import { useTourAccessibility } from '@/lib/accessibility'

function MyTourComponent() {
  const accessibility = useTourAccessibility(
    isActive,
    currentStep,
    totalSteps,
    {
      enableFocusTrap: true,
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableHighContrastMode: true,
      autoAnnounceSteps: true,
      restoreFocusOnExit: true
    }
  )

  return (
    <div ref={accessibility.focusTrapRef}>
      {/* Tour content */}
    </div>
  )
}
```

### Keyboard Navigation

```tsx
import { useKeyboardNavigation } from '@/lib/accessibility'

function TourControls() {
  const handleKeyDown = useKeyboardNavigation({
    onArrowRight: () => nextStep(),
    onArrowLeft: () => previousStep(),
    onEscape: () => closeTour(),
    onSpace: () => togglePause(),
    onHome: () => restartTour(),
    onEnd: () => skipTour()
  })

  return <div onKeyDown={handleKeyDown}>...</div>
}
```

### Screen Reader Announcements

```tsx
import { announceToScreenReader, useTourProgressAnnouncements } from '@/lib/accessibility'

function TourStep() {
  const { announceStepChange } = useTourProgressAnnouncements()

  useEffect(() => {
    announceStepChange(stepIndex, totalSteps, title, 'next')
  }, [stepIndex])

  return <div>...</div>
}
```

### Accessibility Testing

```tsx
import { TourAccessibilityTest } from '@/components/onboarding/tour-accessibility-test'

function TourDemo() {
  const [tourElement, setTourElement] = useState<HTMLElement | null>(null)

  return (
    <div>
      <div ref={setTourElement}>
        {/* Tour component */}
      </div>
      <TourAccessibilityTest 
        tourElement={tourElement}
        onTestComplete={(result) => console.log(result)}
      />
    </div>
  )
}
```

## Testing

The accessibility implementation includes comprehensive testing utilities:

- Automated WCAG compliance checking
- Color contrast validation
- Keyboard navigation testing
- ARIA attribute validation
- Focus management verification
- Motion preference testing

## Browser Support

- Modern browsers with CSS custom properties support
- Screen readers (NVDA, JAWS, VoiceOver, TalkBack)
- High contrast mode (Windows, macOS)
- Reduced motion preferences (all modern browsers)

## Performance Considerations

- Lazy loading of accessibility features
- Efficient event listener management
- Minimal DOM manipulation
- Optimized for screen reader performance
- Memory-conscious focus management

## Future Enhancements

- Voice control support
- Switch navigation support
- Eye tracking compatibility
- Enhanced mobile accessibility
- Internationalization for screen reader content