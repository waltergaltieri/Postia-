'use client'

import { useState } from 'react'
import { 
  FadeIn, 
  SlideIn, 
  ScaleIn, 
  StaggerContainer, 
  StaggerItem,
  AnimatedButton,
  AnimatedCard,
  LoadingSpinner,
  PulseIndicator,
  RippleButton,
  PageTransition,
  Skeleton,
  ContentCardSkeleton,
  CalendarEventSkeleton,
  TableRowSkeleton,
  ProgressRing,
  ProgressBar,
  StepProgress,
  EmptyContentState,
  EmptyCalendarState,
  LoadingOverlay
} from '@/components/animations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Star, Zap, Sparkles } from 'lucide-react'

export default function AnimationsDemo() {
  const [loading, setLoading] = useState(false)
  const [showCards, setShowCards] = useState(true)
  const [showSkeletons, setShowSkeletons] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  const toggleCards = () => {
    setShowCards(!showCards)
  }

  const toggleSkeletons = () => {
    setShowSkeletons(!showSkeletons)
  }

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const simulateSteps = () => {
    setCurrentStep(0)
    const steps = ['Planning', 'Creating', 'Reviewing', 'Publishing']
    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex)
        stepIndex++
      } else {
        clearInterval(interval)
      }
    }, 1000)
  }

  return (
    <PageTransition className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <FadeIn>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Framer Motion Animations
          </h1>
        </FadeIn>
        <SlideIn delay={0.2}>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Premium micro-interactions and smooth animations that enhance the user experience
          </p>
        </SlideIn>
      </div>

      {/* Basic Animations */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <h2 className="text-2xl font-semibold">Basic Animations</h2>
        </SlideIn>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn delay={0.1}>
            <Card variant="interactive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-500" />
                  Fade In
                </CardTitle>
                <CardDescription>
                  Smooth opacity transition
                </CardDescription>
              </CardHeader>
            </Card>
          </FadeIn>

          <SlideIn delay={0.2}>
            <Card variant="interactive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary-500" />
                  Slide In
                </CardTitle>
                <CardDescription>
                  Elegant slide from bottom
                </CardDescription>
              </CardHeader>
            </Card>
          </SlideIn>

          <ScaleIn delay={0.3}>
            <Card variant="interactive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary-500" />
                  Scale In
                </CardTitle>
                <CardDescription>
                  Subtle scale animation
                </CardDescription>
              </CardHeader>
            </Card>
          </ScaleIn>
        </div>
      </section>

      {/* Button Animations */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <h2 className="text-2xl font-semibold">Interactive Buttons</h2>
        </SlideIn>
        
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap gap-4">
            <Button variant="default"> <span>Animated Button</span></Button>
            
            <Button variant="premium" icon={<Heart className="h-4 w-4" /> <span>}>
              Premium Style</span></Button>
            
            <Button 
              variant="success" 
              loading={loading}
              loadingText="Processing..."
              onClick={handleLoadingDemo}
            > <span>{loading ? 'Loading...' : 'Test Loading'}</span></Button>
            
            <RippleButton 
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
              onClick={() => <span>console.log('Ripple clicked!')}
            >
              Ripple Effect</span></RippleButton>
          </div>
        </FadeIn>
      </section>

      {/* Stagger Animations */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Stagger Animations</h2>
            <Button onClick={toggleCards} variant="outline"> <span>Toggle Cards</span></Button>
          </div>
        </SlideIn>
        
        {showCards && (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> <span>{Array.from({ length: 8 }, (_, i) => (</span><StaggerItem key={i}>
                <Card variant="elevated" className="h-32">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-500">
                        {i + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Card {i + 1}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* Loading States */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <h2 className="text-2xl font-semibold">Loading States</h2>
        </SlideIn>
        
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LoadingSpinner />
                  Loading Spinner
                </CardTitle>
                <CardDescription>
                  Smooth rotating spinner
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <PulseIndicator>
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-success-500 rounded-full" />
                      Live Status
                    </Badge>
                  </PulseIndicator>
                </CardTitle>
                <CardDescription>
                  Pulsing notification indicator
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress States</CardTitle>
                <CardDescription>
                  Various loading indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner className="h-3 w-3" />
                    <span className="text-sm">Small spinner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LoadingSpinner className="h-5 w-5" />
                    <span className="text-sm">Medium spinner</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      </section>

      {/* Skeleton Screens */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Skeleton Screens</h2>
            <Button onClick={toggleSkeletons} variant="outline"> <span>{showSkeletons ? 'Show Content' : 'Show Skeletons'}</span></Button>
          </div>
        </SlideIn>
        
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showSkeletons ? (
              <>
                <ContentCardSkeleton />
                <CalendarEventSkeleton />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <TableRowSkeleton columns={3} />
                  <TableRowSkeleton columns={3} />
                  <TableRowSkeleton columns={3} />
                </div>
              </>
            ) : (
              <>
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Content Card</CardTitle>
                    <CardDescription>Real content loaded</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This is what the content looks like when fully loaded.</p>
                  </CardContent>
                </Card>
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Calendar Event</CardTitle>
                    <CardDescription>Event details loaded</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Meeting with client at 2:00 PM</p>
                  </CardContent>
                </Card>
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Data Table</CardTitle>
                    <CardDescription>Table data loaded</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Item 1</span>
                        <span>Value 1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Item 2</span>
                        <span>Value 2</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </FadeIn>
      </section>

      {/* Progress Indicators */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <h2 className="text-2xl font-semibold">Progress Indicators</h2>
        </SlideIn>
        
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Progress Ring</CardTitle>
                <CardDescription>Circular progress indicator</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <ProgressRing progress={progress} size={80} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Bar</CardTitle>
                <CardDescription>Linear progress with animation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar progress={progress} showLabel />
                <Button onClick={simulateProgress} variant="outline" className="w-full"> <span>Simulate Progress</span></Button>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle>Step Progress</CardTitle>
              <CardDescription>Multi-step process indicator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StepProgress 
                steps={['Planning', 'Creating', 'Reviewing', 'Publishing']}
                currentStep={currentStep}
              />
              <Button onClick={simulateSteps} variant="outline" className="w-full"> <span>Simulate Steps</span></Button>
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      {/* Empty States */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <h2 className="text-2xl font-semibold">Empty States</h2>
        </SlideIn>
        
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <EmptyContentState 
                action={
                  <Button variant="premium">
                    <Zap className="h-4 w-4 mr-2" /> <span>Create Content</span></Button>
                }
              />
            </Card>

            <Card>
              <EmptyCalendarState 
                action={
                  <Button variant="outline"> <span>Schedule Post</span></Button>
                }
              />
            </Card>
          </div>
        </FadeIn>
      </section>

      {/* Loading Overlay Demo */}
      <section className="space-y-6">
        <SlideIn variant="slideInFromLeft">
          <h2 className="text-2xl font-semibold">Loading Overlay</h2>
        </SlideIn>
        
        <FadeIn delay={0.2}>
          <LoadingOverlay 
            isLoading={loading} 
            loadingText="Generating content..."
          >
            <Card className="h-64">
              <CardHeader>
                <CardTitle>Content Area</CardTitle>
                <CardDescription>This area will be overlaid when loading</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This content will be dimmed and overlaid with a loading spinner when the loading state is active.</p>
                <Button 
                  onClick={handleLoadingDemo} 
                  className="mt-4"
                  disabled={loading}
                > <span>{loading ? 'Loading...' : 'Trigger Loading Overlay'}</span></Button>
              </CardContent>
            </Card>
          </LoadingOverlay>
        </FadeIn>
      </section>

      {/* Performance Note */}
      <FadeIn delay={0.5}>
        <Card variant="glass" className="text-center">
          <CardContent className="py-8">
            <h3 className="text-lg font-semibold mb-2">
              Premium Performance
            </h3>
            <p className="text-muted-foreground">
              All animations are GPU-accelerated and respect user motion preferences
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </PageTransition>
  )
}