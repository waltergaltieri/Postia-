'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UsabilityTestingInterface } from '@/components/testing/usability-testing-interface'
import { FeedbackDashboard } from '@/components/testing/feedback-dashboard'
import { useAutoSessionRecording } from '@/hooks/use-user-testing-recorder'
import { UserTestingSession } from '@/lib/usability-testing'
import {
  TestTube,
  BarChart3,
  Users,
  Target,
  Lightbulb,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Eye,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react'

export default function UsabilityTestingPage() {
  const [activeTab, setActiveTab] = useState('testing')
  const [completedSessions, setCompletedSessions] = useState<UserTestingSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()

  // Auto-record user interactions during testing
  const recorder = useAutoSessionRecording(currentSessionId)

  const handleSessionComplete = (session: UserTestingSession) => {
    setCompletedSessions(prev => [...prev, session])
    setCurrentSessionId(undefined)
    
    // Show completion message
    console.log('Session completed:', session)
  }

  const handleSessionStart = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3"
        >
          <TestTube className="h-8 w-8 text-info-600" />
          <h1 className="text-4xl font-bold text-gray-900">Usability Testing Center</h1>
        </motion.div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Comprehensive usability testing and feedback collection system for improving 
          Postia's user experience and visual design
        </p>
      </div>

      {/* Recording Status */}
      {recorder.isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="bg-error-50 border-error-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-error-800">
                <div className="w-2 h-2 bg-error-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording Session</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recording</CardTitle>
            <div className="flex items-center gap-1">
              {recorder.isRecording ? (
                <div className="w-2 h-2 bg-error-500 rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recorder.isRecording ? 'ON' : 'OFF'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Recorded</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recorder.recordedActions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testing Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentSessionId ? 'Active' : 'Ready'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing Interface
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Session History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-success-600" />
                User Testing Interface
              </CardTitle>
              <CardDescription>
                Conduct moderated usability testing sessions with real users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsabilityTestingInterface
                userId="current-user"
                onSessionComplete={handleSessionComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <FeedbackDashboard />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-info-600" />
                Session History
              </CardTitle>
              <CardDescription>
                Review completed testing sessions and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No completed sessions yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start a testing session to see results here
                  </p>
                  <Button onClick={() => <span>setActiveTab('testing')}></span><Play className="h-4 w-4 mr-2" /> <span>Start Testing</span></Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold">Session {session.id}</h4>
                              <p className="text-sm text-gray-600">
                                {session.startTime.toLocaleString()} - {session.endTime?.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                              {session.status}
                            </Badge>
                          </div>

                          <div className="grid gap-4 md:grid-cols-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-info-600">
                                {session.metrics.taskCompletionRate.toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-600">Completion Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-success-600">
                                {session.metrics.userSatisfactionScore.toFixed(1)}/5
                              </div>
                              <div className="text-sm text-gray-600">Satisfaction</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {session.metrics.aestheticRating.toFixed(1)}/5
                              </div>
                              <div className="text-sm text-gray-600">Aesthetic Rating</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {session.metrics.errorRate.toFixed(0)}%
                              </div>
                              <div className="text-sm text-gray-600">Error Rate</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {session.tasks.length} tasks
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {session.feedback.length} feedback items
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {session.sessionType}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Recording Settings
                </CardTitle>
                <CardDescription>
                  Configure what user interactions to track during testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Track Clicks</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Track Scrolling</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Track Hover Events</span>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Track Keystrokes</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Track Navigation</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  Testing Focus Areas
                </CardTitle>
                <CardDescription>
                  Key areas being evaluated in usability testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning-600" />
                  <span>Visual Design & Aesthetics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-info-600" />
                  <span>User Interface Usability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-success-600" />
                  <span>Workflow Efficiency</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span>Performance & Responsiveness</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  <span>Content Creation Flow</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning-600" />
                  Testing Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>• Focus on natural behavior - use the app as you normally would</p>
                <p>• Think aloud during tasks to provide context for your actions</p>
                <p>• Don't hesitate to provide honest feedback about visual design</p>
                <p>• Report any confusion or difficulties immediately</p>
                <p>• Rate aesthetic appeal alongside functional usability</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  Success Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>• Task completion rate &gt; 90%</p>
                <p>• User satisfaction score &gt; 4/5</p>
                <p>• Aesthetic rating &gt; 4/5</p>
                <p>• Error rate &lt; 10%</p>
                <p>• Average task time within expected range</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}