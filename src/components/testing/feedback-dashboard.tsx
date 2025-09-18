'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  MessageSquare,
  Target,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Download,
  Filter
} from 'lucide-react'
import { usabilityTesting, UserFeedback, UsabilityMetrics } from '@/lib/usability-testing'

interface FeedbackDashboardProps {
  className?: string
}

export function FeedbackDashboard({ className }: FeedbackDashboardProps) {
  const [report, setReport] = useState(usabilityTesting.generateUsabilityReport())
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'aesthetic' | 'usability' | 'functionality' | 'performance'>('all')
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')

  // Refresh report data
  const refreshReport = () => {
    setReport(usabilityTesting.generateUsabilityReport())
  }

  useEffect(() => {
    refreshReport()
    const interval = setInterval(refreshReport, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Filter feedback based on selected filters
  const filteredFeedback = report.topIssues.filter(feedback => {
    const typeMatch = selectedFilter === 'all' || feedback.type === selectedFilter
    const priorityMatch = selectedPriority === 'all' || feedback.priority === selectedPriority
    return typeMatch && priorityMatch
  })

  // Prepare chart data
  const feedbackByType = [
    { name: 'Aesthetic', value: report.topIssues.filter(f => f.type === 'aesthetic').length, color: '#8b5cf6' },
    { name: 'Usability', value: report.topIssues.filter(f => f.type === 'usability').length, color: '#06b6d4' },
    { name: 'Functionality', value: report.topIssues.filter(f => f.type === 'functionality').length, color: '#10b981' },
    { name: 'Performance', value: report.topIssues.filter(f => f.type === 'performance').length, color: '#f59e0b' }
  ]

  const feedbackByCategory = [
    { name: 'Issues', value: report.topIssues.filter(f => f.category === 'negative').length, color: '#ef4444' },
    { name: 'Positive', value: report.topIssues.filter(f => f.category === 'positive').length, color: '#10b981' },
    { name: 'Suggestions', value: report.topIssues.filter(f => f.category === 'suggestion').length, color: '#3b82f6' }
  ]

  const metricsData = [
    { name: 'Task Completion', value: report.overallMetrics.taskCompletionRate, target: 90 },
    { name: 'User Satisfaction', value: report.overallMetrics.userSatisfactionScore * 20, target: 80 },
    { name: 'Aesthetic Rating', value: report.overallMetrics.aestheticRating * 20, target: 80 },
    { name: 'Error Rate', value: 100 - report.overallMetrics.errorRate, target: 80 }
  ]

  const getPriorityColor = (priority: UserFeedback['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: UserFeedback['type']) => {
    switch (type) {
      case 'aesthetic': return <Eye className="h-4 w-4" />
      case 'usability': return <Users className="h-4 w-4" />
      case 'functionality': return <Zap className="h-4 w-4" />
      case 'performance': return <TrendingUp className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCategoryIcon = (category: UserFeedback['category']) => {
    switch (category) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-600" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      completedSessions: report.completedSessions,
      overallMetrics: report.overallMetrics,
      topIssues: report.topIssues,
      recommendations: report.recommendations
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usability-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usability Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Insights from {report.completedSessions} completed testing sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshReport}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.overallMetrics.taskCompletionRate.toFixed(1)}%
            </div>
            <Progress value={report.overallMetrics.taskCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.overallMetrics.userSatisfactionScore.toFixed(1)}/5
            </div>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= report.overallMetrics.userSatisfactionScore
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aesthetic Rating</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.overallMetrics.aestheticRating.toFixed(1)}/5
            </div>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= report.overallMetrics.aestheticRating
                      ? 'text-purple-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.overallMetrics.errorRate.toFixed(1)}%
            </div>
            <Progress 
              value={100 - report.overallMetrics.errorRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key usability metrics vs targets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                    <Bar dataKey="target" fill="#e5e7eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Distribution</CardTitle>
                <CardDescription>Feedback by type and category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">By Type</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={feedbackByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {feedbackByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">By Category</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={feedbackByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {feedbackByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="p-2 border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="aesthetic">Aesthetic</option>
                  <option value="usability">Usability</option>
                  <option value="functionality">Functionality</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="p-2 border rounded-md"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No feedback matches the selected filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredFeedback.map((feedback) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(feedback.category)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(feedback.type)}
                              <span className="font-medium capitalize">{feedback.type}</span>
                              <Badge className={getPriorityColor(feedback.priority)}>
                                {feedback.priority}
                              </Badge>
                            </div>
                            {feedback.component && (
                              <p className="text-sm text-gray-600">
                                Component: {feedback.component}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= feedback.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-800 mb-2">{feedback.comment}</p>
                      <p className="text-xs text-gray-500">
                        {feedback.timestamp.toLocaleString()}
                        {feedback.page && ` • ${feedback.page}`}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Improvement Recommendations
              </CardTitle>
              <CardDescription>
                Based on {report.completedSessions} testing sessions and user feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Great job! No critical recommendations at this time.
                  </p>
                </div>
              ) : (
                report.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-800">{recommendation}</p>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Action Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.overallMetrics.aestheticRating < 4 && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                  <span className="text-purple-800">
                    Review visual design elements - aesthetic rating is below target
                  </span>
                </div>
              )}
              {report.overallMetrics.taskCompletionRate < 80 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800">
                    Simplify user workflows - task completion rate needs improvement
                  </span>
                </div>
              )}
              {report.overallMetrics.errorRate > 20 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    Address usability issues - error rate is above acceptable threshold
                  </span>
                </div>
              )}
              {report.overallMetrics.userSatisfactionScore < 4 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">
                    Focus on user experience improvements - satisfaction score needs attention
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}