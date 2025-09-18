/**
 * Tests for Tour Metrics Dashboard
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { TourMetricsDashboard } from '../tour-metrics-dashboard'
import { useTourAnalytics } from '@/lib/tour/tour-analytics'

// Mock the analytics hook
jest.mock('@/lib/tour/tour-analytics', () => ({
  useTourAnalytics: jest.fn(),
  TourAnalyticsEngine: jest.fn(),
  CompletionAnalyzer: {
    analyzeCompletion: jest.fn(),
    generateRecommendations: jest.fn()
  },
  BehaviorAnalyzer: {
    analyzeBehavior: jest.fn(),
    generateBehaviorRecommendations: jest.fn()
  }
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}))

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>
}))

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value} />
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>
}))

const mockUseTourAnalytics = useTourAnalytics as jest.MockedFunction<typeof useTourAnalytics>

describe('TourMetricsDashboard', () => {
  const mockAnalytics = {
    calculateTourMetrics: jest.fn(),
    exportAnalytics: jest.fn(),
    trackEvent: jest.fn(),
    startTourTracking: jest.fn(),
    trackStepViewed: jest.fn(),
    trackStepCompleted: jest.fn(),
    trackTourCompleted: jest.fn(),
    trackTourSkipped: jest.fn(),
    trackHelpRequested: jest.fn(),
    getTourAnalytics: jest.fn(),
    clearAnalytics: jest.fn()
  }

  beforeEach(() => {
    mockUseTourAnalytics.mockReturnValue(mockAnalytics)
    jest.clearAllMocks()
  })

  it('should render loading state initially', () => {
    mockAnalytics.calculateTourMetrics.mockReturnValue({
      startRate: 0,
      completionRate: 0,
      dropoffPoints: [],
      averageDuration: 0,
      helpRequests: 0,
      skipRate: 0,
      stepMetrics: []
    })
    
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard />)
    
    // Should show loading skeleton initially
    expect(screen.getByText('No hay datos de analytics disponibles')).toBeInTheDocument()
  })

  it('should render metrics when data is available', async () => {
    const mockMetrics = {
      startRate: 85.5,
      completionRate: 72.3,
      dropoffPoints: [2, 4],
      averageDuration: 180000,
      helpRequests: 15,
      skipRate: 27.7,
      stepMetrics: [
        {
          stepIndex: 0,
          viewCount: 100,
          completionCount: 85,
          averageTimeSpent: 30000,
          dropoffCount: 15,
          helpRequestCount: 5
        },
        {
          stepIndex: 1,
          viewCount: 85,
          completionCount: 75,
          averageTimeSpent: 25000,
          dropoffCount: 10,
          helpRequestCount: 3
        }
      ]
    }

    mockAnalytics.calculateTourMetrics.mockReturnValue(mockMetrics)
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [{
        tourId: 'test-tour',
        userId: 'user1',
        sessionId: 'session1',
        events: [],
        metrics: {
          totalDuration: 180000,
          stepDurations: [30000, 25000],
          completionRate: 100,
          interactionCount: 5
        }
      }],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard tourId="test-tour" />)

    await waitFor(() => {
      expect(screen.getByText('72.3%')).toBeInTheDocument() // Completion rate
      expect(screen.getByText('180s')).toBeInTheDocument() // Average duration
      expect(screen.getByText('15')).toBeInTheDocument() // Help requests
      expect(screen.getByText('27.7%')).toBeInTheDocument() // Skip rate
    })
  })

  it('should display step metrics correctly', async () => {
    const mockMetrics = {
      startRate: 85.5,
      completionRate: 72.3,
      dropoffPoints: [],
      averageDuration: 180000,
      helpRequests: 15,
      skipRate: 27.7,
      stepMetrics: [
        {
          stepIndex: 0,
          viewCount: 100,
          completionCount: 85,
          averageTimeSpent: 30000,
          dropoffCount: 15,
          helpRequestCount: 5
        }
      ]
    }

    mockAnalytics.calculateTourMetrics.mockReturnValue(mockMetrics)
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard tourId="test-tour" />)

    await waitFor(() => {
      expect(screen.getByText('Paso 1')).toBeInTheDocument()
      expect(screen.getByText('100 vistas')).toBeInTheDocument()
      expect(screen.getByText('85 completados')).toBeInTheDocument()
      expect(screen.getByText('5 ayudas')).toBeInTheDocument()
    })
  })

  it('should show empty state when no data is available', async () => {
    mockAnalytics.calculateTourMetrics.mockReturnValue({
      startRate: 0,
      completionRate: 0,
      dropoffPoints: [],
      averageDuration: 0,
      helpRequests: 0,
      skipRate: 0,
      stepMetrics: []
    })
    
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No hay datos de analytics disponibles')).toBeInTheDocument()
      expect(screen.getByText('Los datos aparecerán aquí una vez que los usuarios comiencen a usar los tours.')).toBeInTheDocument()
    })
  })

  it('should handle real-time updates when enabled', async () => {
    const mockMetrics = {
      startRate: 85.5,
      completionRate: 72.3,
      dropoffPoints: [],
      averageDuration: 180000,
      helpRequests: 15,
      skipRate: 27.7,
      stepMetrics: []
    }

    mockAnalytics.calculateTourMetrics.mockReturnValue(mockMetrics)
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard tourId="test-tour" showRealTimeUpdates={true} />)

    // Simulate real-time event
    const event = new CustomEvent('tour-analytics-event', {
      detail: {
        type: 'tour_completed',
        timestamp: new Date(),
        metadata: { tourId: 'test-tour', userId: 'user1' }
      }
    })

    window.dispatchEvent(event)

    // Should call calculateTourMetrics again
    await waitFor(() => {
      expect(mockAnalytics.calculateTourMetrics).toHaveBeenCalledWith('test-tour')
    })
  })

  it('should display trend indicators correctly', async () => {
    const mockMetrics = {
      startRate: 85.5,
      completionRate: 75.0, // Good completion rate
      dropoffPoints: [],
      averageDuration: 180000,
      helpRequests: 15,
      skipRate: 15.0, // Low skip rate (good)
      stepMetrics: []
    }

    mockAnalytics.calculateTourMetrics.mockReturnValue(mockMetrics)
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard tourId="test-tour" />)

    await waitFor(() => {
      expect(screen.getByText('75.0%')).toBeInTheDocument()
      expect(screen.getByText('15.0%')).toBeInTheDocument()
    })
  })

  it('should render tabs correctly', async () => {
    const mockMetrics = {
      startRate: 85.5,
      completionRate: 72.3,
      dropoffPoints: [],
      averageDuration: 180000,
      helpRequests: 15,
      skipRate: 27.7,
      stepMetrics: []
    }

    mockAnalytics.calculateTourMetrics.mockReturnValue(mockMetrics)
    mockAnalytics.exportAnalytics.mockReturnValue({
      events: [],
      analytics: [],
      sessionId: 'test',
      exportedAt: new Date()
    })

    render(<TourMetricsDashboard tourId="test-tour" />)

    await waitFor(() => {
      expect(screen.getByText('Resumen')).toBeInTheDocument()
      expect(screen.getByText('Completación')).toBeInTheDocument()
      expect(screen.getByText('Comportamiento')).toBeInTheDocument()
      expect(screen.getByText('Por Pasos')).toBeInTheDocument()
    })
  })

  it('should handle errors gracefully', async () => {
    mockAnalytics.calculateTourMetrics.mockImplementation(() => {
      throw new Error('Analytics error')
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<TourMetricsDashboard tourId="test-tour" />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading analytics:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})