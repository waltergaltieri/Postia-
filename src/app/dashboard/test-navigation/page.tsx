'use client'

import { useNavigation } from '@/components/navigation/navigation-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestNavigationPage() {
  const {
    currentClient,
    clients,
    setCurrentClient,
    workflowStep,
    totalSteps,
    setWorkflowProgress
  } = useNavigation()

  const startWorkflow = () => {
    setWorkflowProgress(1, 4)
  }

  const nextStep = () => {
    if (workflowStep < totalSteps) {
      setWorkflowProgress(workflowStep + 1, totalSteps)
    }
  }

  const resetWorkflow = () => {
    setWorkflowProgress(0, 0)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Navigation Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the navigation system components and context
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Client */}
        <Card>
          <CardHeader>
            <CardTitle>Current Client</CardTitle>
            <CardDescription>
              Active client context for navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentClient ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: currentClient.brandColors[0] }}
                  >
                    {currentClient.brandName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{currentClient.brandName}</p>
                    <div className="flex space-x-1 mt-1">
                      {currentClient.brandColors.map((color, index) => (
                        <div
                          key={index}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Switch to:</p>
                  <div className="flex flex-wrap gap-2">
                    {clients.filter(c => c.id !== currentClient.id).map(client => (
                      <Button
                        key={client.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentClient(client)}
                      >
                        {client.brandName}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No client selected</p>
            )}
          </CardContent>
        </Card>

        {/* Workflow Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
            <CardDescription>
              Test workflow progress indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Step:</span>
                <Badge variant={workflowStep > 0 ? "default" : "secondary"}>
                  {workflowStep} / {totalSteps}
                </Badge>
              </div>
              
              {totalSteps > 0 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(workflowStep / totalSteps) * 100}%` }}
                  />
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={startWorkflow}
                  disabled={workflowStep > 0}
                >
                  Start Workflow
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={nextStep}
                  disabled={workflowStep === 0 || workflowStep >= totalSteps}
                >
                  Next Step
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetWorkflow}
                  disabled={workflowStep === 0}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation State */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Navigation State</CardTitle>
            <CardDescription>
              Current navigation context data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Clients ({clients.length})</h4>
                <div className="space-y-1">
                  {clients.map(client => (
                    <div 
                      key={client.id}
                      className={`text-sm p-2 rounded ${
                        client.id === currentClient?.id 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {client.brandName}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Workflow</h4>
                <div className="text-sm space-y-1">
                  <p>Step: {workflowStep}</p>
                  <p>Total: {totalSteps}</p>
                  <p>Active: {workflowStep > 0 ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Current Path</h4>
                <div className="text-sm">
                  <code className="bg-muted px-2 py-1 rounded">
                    {typeof window !== 'undefined' ? window.location.pathname : '/dashboard/test-navigation'}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}