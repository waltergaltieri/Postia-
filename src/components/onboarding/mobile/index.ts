// Mobile-optimized tour components
export { MobileTourControls, useMobileTourControls } from './mobile-tour-controls'
export { MobileTourPopover } from './mobile-tour-popover'
export { MobileTourSpotlight, useMobileTourSpotlight } from './mobile-tour-spotlight'
export { MobileTourLayout, useMobileTourLayout, getOptimalMobileLayout } from './mobile-tour-layout'
export { MobileTourWrapper, useMobileTourWrapper, withMobileTour } from './mobile-tour-wrapper'

// Mobile utilities
export { 
  MobileGestureHandler, 
  useMobileGestureHandler, 
  MobileUtils, 
  useMobileUtils 
} from '../../../lib/tour/mobile-gesture-handler'

export { 
  MobilePositioning, 
  useMobilePositioning, 
  MobilePositioningUtils 
} from '../../../lib/tour/mobile-positioning'

// Responsive tour utilities
export { 
  ResponsiveTourAdapter, 
  useResponsiveTourAdapter, 
  ResponsiveTourUtils 
} from '../../../lib/tour/responsive-tour-adapter'

export { 
  ResponsiveContentGenerator, 
  useResponsiveContentGenerator, 
  ContentOptimizationUtils 
} from '../../../lib/tour/responsive-content-generator'

// Types
export type {
  GestureConfig,
  GestureCallbacks,
  TouchPoint
} from '../../../lib/tour/mobile-gesture-handler'

export type {
  MobilePosition,
  ViewportInfo,
  PositioningOptions
} from '../../../lib/tour/mobile-positioning'