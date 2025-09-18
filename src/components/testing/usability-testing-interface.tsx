'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react'
import {
  usabilityTesting,
  UserTestingSession,
  TestTask,
  UserFeedback,
  POSTIA_TESTING_SCENARIOS,
  TestingScenario
} from '@/lib/usability-testing'

interface UsabilityTestingInterfaceProps {
  userId?: string
  onSessionComplete?: (session: UserTestingSession) => void
}

export function UsabilityTestingInterface({ 
  userId = 'test-user', 
  onSessionComplete 
}: UsabilityTestingInterfaceProps) {
  const [currentSession, setCurrentSession] = useState<UserTestingSession | null>(null)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [selectedScenario, setSelectedScenario] = useState<TestingScenario | null>(null)
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'usability' as UserFeedback['type'],
    category: 'positive' as UserFeedback['category'],
    rating: 5,
    comment: '',
    component: '',
    priority: 'medium' as UserFeedback['priority']
  })
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null)

  // Start a new testing session
  const startSession = (scenario: TestingScenario) => {
    const session = usabilityTesting.startSession(userId, 'moderated', scenario)
    setCurrentSession(session)
    setSelectedScenario(scenario)
    setCurrentTaskIndex(0)
    
    // Start first task
    if (scenario.tasks.length > 0) {
      usabilityTesting.startTask(session.id, scenario.tasks[0].id)
      setTaskStartTime(new Date())
    }
  }

  // Complete current task
  const completeCurrentTask = (difficulty: number) => {
    if (!currentSession || !selectedScenario) return

    const currentTask = selectedScenario.tasks[currentTaskIndex]
    usabilityTesting.completeTask(currentSession.id, currentTask.id, difficulty)

    // Move to next task or end session
    if (currentTaskIndex < selectedScenario.tasks.length - 1) {
      const nextTaskIndex = currentTaskIndex + 1
      setCurrentTaskIndex(nextTaskIndex)
      usabilityTesting.startTask(currentSession.id, selectedScenario.tasks[nextTaskIndex].id)
      setTaskStartTime(new Date())
    } else {
      endSession()
    }
  }

  // End the current session
  const endSession = () => {
    if (!currentSession) return

    const completedSession = usabilityTesting.endSession(currentSession.id)
    if (completedSession && onSessionComplete) {
      onSessionComplete(completedSession)
    }
    
    setCurrentSession(null)
    setSelectedScenario(null)
    setCurrentTaskIndex(0)
    setTaskStartTime(null)
  }

  // Submit feedback
  const submitFeedback = () => {
    if (!currentSession) return

    usabilityTesting.addFeedback(currentSession.id, {
      ...feedbackForm,
      page: window.location.pathname
    })

    setFeedbackForm({
      type: 'usability',
      category: 'positive',
      rating: 5,
      comment: '',
      component: '',
      priority: 'medium'
    })
    setShowFeedbackForm(false)
  }

  // Record error
  const recordError = (description: string, type: 'navigation' | 'interaction' | 'understanding' | 'technical') => {
    if (!currentSession || !selectedScenario) return

    const currentTask = selectedScenario.tasks[currentTaskIndex]
    usabilityTesting.recordError(currentSession.id, currentTask.id, {
      type,
      description,
      timestamp: new Date(),
      resolved: false,
      impact: 'medium'
    })
  }

  const currentTask = selectedScenario?.tasks[currentTaskIndex]
  const progress = selectedScenario ? ((currentTaskIndex + 1) / selectedScenario.tasks.length) * 100 : 0

  if (!currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Usability Testing Center</h1>
          <p className="text-lg text-gray-600">
            Help us improve Postia by participating in user testing sessions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTIA_TESTING_SCENARIOS.map((scenario) => (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    {scenario.name}
                  </CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    {scenario.userPersona}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    ~{scenario.estimatedDuration} minutes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4" />
                    {scenario.tasks.length} tasks
                  </div>
                  <Button 
                    onClick={() => startSession(scenario)}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Testing
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Testing Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">What we're testing:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Visual design and aesthetics</li>
                  <li>• User interface usability</li>
                  <li>• Workflow efficiency</li>
                  <li>• Mobile responsiveness</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Your feedback helps us:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Identify usability issues</li>
                  <li>• Improve visual design</li>
                  <li>• Optimize user workflows</li>
                  <li>• Enhance overall experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                {selectedScenario?.name}
              </CardTitle>
              <CardDescription>
                Task {currentTaskIndex + 1} of {selectedScenario?.tasks.length}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={endSession}>
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Current Task */}
      {currentTask && (
        <motion.div
          key={currentTask.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {currentTask.title}
              </CardTitle>
              <CardDescription>{currentTask.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Expected Outcome:</h4>
                <p className="text-blue-800">{currentTask.expectedOutcome}</p>
              </div>

              {taskStartTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Started {taskStartTime.toLocaleTimeString()}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => completeCurrentTask(1)}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Very Difficult (1/5)
                </Button>
                <Button
                  onClick={() => completeCurrentTask(2)}
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  Difficult (2/5)
                </Button>
                <Button
                  onClick={() => completeCurrentTask(3)}
                  variant="outline"
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                >
                  Moderate (3/5)
                </Button>
                <Button
                  onClick={() => completeCurrentTask(4)}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Easy (4/5)
                </Button>
                <Button
                  onClick={() => completeCurrentTask(5)}
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Very Easy (5/5)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Quick Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowFeedbackForm(true)}
              className="w-full"
              variant="outline"
            >
              Provide Feedback
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Report Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => recordError('Navigation was confusing', 'navigation')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Navigation Issue
            </Button>
            <Button
              onClick={() => recordError('Button/link did not work as expected', 'interaction')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Interaction Issue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Form Modal */}
      <AnimatePresence>
        {showFeedbackForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowFeedbackForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold">Provide Feedback</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={feedbackForm.type}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, type: e.target.value as UserFeedback['type'] }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="aesthetic">Aesthetic/Visual</option>
                    <option value="usability">Usability</option>
                    <option value="functionality">Functionality</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value as UserFeedback['category'] }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="positive">Positive</option>
                    <option value="negative">Issue/Problem</option>
                    <option value="suggestion">Suggestion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating }))}
                        className={`p-1 ${feedbackForm.rating >= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Component (optional)</label>
                  <input
                    type="text"
                    value={feedbackForm.component}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, component: e.target.value }))}
                    placeholder="e.g., Navigation, Button, Form"
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Describe your feedback..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowFeedbackForm(false)}>
                  Cancel
                </Button>
                <Button onClick={submitFeedback}>
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}