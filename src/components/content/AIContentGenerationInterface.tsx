'use client';

import { useState, useEffect } from 'react';
import { useNavigation, useClientManagement } from '@/components/navigation/navigation-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Lightbulb,
  FileText,
  Image,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface GenerationStep {
  step: 'IDEA_GENERATION' | 'COPY_DESIGN' | 'COPY_PUBLICATION' | 'BASE_IMAGE' | 'FINAL_DESIGN';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: any;
  tokensUsed: number;
  executedAt?: string;
  error?: string;
}

interface ContentJob {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  tokensConsumed: number;
  createdAt: string;
  completedAt?: string;
  steps: GenerationStep[];
  brandContext: any;
}

interface Client {
  id: string;
  brandName: string;
  brandColors: string[];
  description: string;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  brandTone: string;
}

export default function AIContentGenerationInterface() {
  const { currentClient, clients } = useNavigation();
  const { selectedClientId, clientWorkspaceMode, isClientDataIsolated } = useClientManagement();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentJob, setCurrentJob] = useState<ContentJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobPolling, setJobPolling] = useState<NodeJS.Timeout | null>(null);

  // Generation form state
  const [generationForm, setGenerationForm] = useState({
    clientId: isClientDataIsolated && selectedClientId ? selectedClientId : '',
    campaignId: '',
    prompt: '',
    contentType: 'social_post',
    platforms: ['instagram'],
    includeImages: true,
    brandTone: '',
    targetAudience: '',
    callToAction: '',
    aiProvider: 'openai',
    model: 'gpt-3.5-turbo',
  });

  useEffect(() => {
    if (generationForm.clientId) {
      fetchCampaigns(generationForm.clientId);
    }
  }, [generationForm.clientId]);

  // Auto-set client when in client workspace mode
  useEffect(() => {
    if (isClientDataIsolated && selectedClientId && generationForm.clientId !== selectedClientId) {
      setGenerationForm(prev => ({ ...prev, clientId: selectedClientId }));
    }
  }, [selectedClientId, isClientDataIsolated]);

  useEffect(() => {
    return () => {
      if (jobPolling) {
        clearInterval(jobPolling);
      }
    };
  }, [jobPolling]);



  const fetchCampaigns = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/campaigns`, {
        headers: {
          // Add client context header for API isolation
          ...(selectedClientId && { 'x-client-id': selectedClientId })
        }
      });
      const result = await response.json();

      if (result.success) {
        setCampaigns(result.data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const startGeneration = async () => {
    if (!generationForm.clientId || !generationForm.prompt) {
      toast.error('Please select a client and provide a prompt');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add client context header for API isolation
          ...(selectedClientId && { 'x-client-id': selectedClientId })
        },
        body: JSON.stringify(generationForm),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentJob(result.data.job);
        toast.success('Content generation started');
        startJobPolling(result.data.job.id);
      } else {
        toast.error(result.error?.message || 'Failed to start generation');
      }
    } catch (error) {
      console.error('Error starting generation:', error);
      toast.error('Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  const startJobPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/content/jobs/${jobId}`);
        const result = await response.json();

        if (result.success) {
          setCurrentJob(result.data.job);

          if (result.data.job.status === 'COMPLETED' || result.data.job.status === 'FAILED') {
            clearInterval(interval);
            setJobPolling(null);

            if (result.data.job.status === 'COMPLETED') {
              toast.success('Content generation completed!');
            } else {
              toast.error('Content generation failed');
            }
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);

    setJobPolling(interval);
  };

  const regenerateStep = async (step: string) => {
    if (!currentJob) return;

    try {
      const response = await fetch(`/api/content/jobs/${currentJob.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Regenerating ${step.toLowerCase()}`);
        startJobPolling(currentJob.id);
      } else {
        toast.error(result.error?.message || 'Failed to regenerate step');
      }
    } catch (error) {
      console.error('Error regenerating step:', error);
      toast.error('Failed to regenerate step');
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'IDEA_GENERATION':
      case 'IDEA':
        return <Lightbulb className="h-4 w-4" />;
      case 'COPY_DESIGN':
      case 'COPY_PUBLICATION':
        return <FileText className="h-4 w-4" />;
      case 'BASE_IMAGE':
      case 'FINAL_DESIGN':
        return <Image className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'IDEA_GENERATION':
      case 'IDEA':
        return 'Content Idea';
      case 'COPY_DESIGN':
        return 'Copy for Design';
      case 'COPY_PUBLICATION':
        return 'Publication Copy';
      case 'BASE_IMAGE':
        return 'Base Image';
      case 'FINAL_DESIGN':
        return 'Final Design';
      default:
        return step;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-info-600 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-error-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const calculateProgress = () => {
    if (!currentJob) return 0;

    const completedSteps = currentJob.steps.filter(step => step.status === 'COMPLETED').length;
    return (completedSteps / currentJob.steps.length) * 100;
  };

  const selectedClient = isClientDataIsolated && currentClient 
    ? currentClient 
    : clients.find(c => c.id === generationForm.clientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isClientDataIsolated && currentClient 
              ? `${currentClient.brandName} - AI Content Generation`
              : 'AI Content Generation'
            }
          </h1>
          <p className="text-muted-foreground">
            {isClientDataIsolated && currentClient
              ? `Create engaging content for ${currentClient.brandName} with AI-powered generation`
              : 'Create engaging content with AI-powered generation'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Content Generation
            </CardTitle>
            <CardDescription>
              Configure your content generation parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Only show client selector in admin mode */}
              {!isClientDataIsolated && (
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={generationForm.clientId}
                    onValueChange={(value) => setGenerationForm({ ...generationForm, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.brandName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Show selected client in client mode */}
              {isClientDataIsolated && currentClient && (
                <div>
                  <Label htmlFor="client">Client</Label>
                  <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50">
                    {currentClient.logoUrl ? (
                      <img 
                        src={currentClient.logoUrl} 
                        alt={`${currentClient.brandName} logo`}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: currentClient.brandColors[0] }}
                      >
                        {currentClient.brandName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{currentClient.brandName}</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select
                  value={generationForm.campaignId}
                  onValueChange={(value) => setGenerationForm({ ...generationForm, campaignId: value })}
                  disabled={!generationForm.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prompt">Content Prompt</Label>
              <Textarea
                id="prompt"
                value={generationForm.prompt}
                onChange={(e) => setGenerationForm({ ...generationForm, prompt: e.target.value })}
                placeholder="Describe the content you want to generate..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contentType">Content Type</Label>
                <Select
                  value={generationForm.contentType}
                  onValueChange={(value) => setGenerationForm({ ...generationForm, contentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_post">Social Post</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="video_script">Video Script</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="aiProvider">AI Provider</Label>
                <Select
                  value={generationForm.aiProvider}
                  onValueChange={(value) => {
                    setGenerationForm({
                      ...generationForm,
                      aiProvider: value,
                      model: value === 'openai' ? 'gpt-3.5-turbo' : 'gemini-pro'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span>OpenAI (GPT)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Google Gemini</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Select
                  value={generationForm.model}
                  onValueChange={(value) => setGenerationForm({ ...generationForm, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generationForm.aiProvider === 'openai' ? (
                      <>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, Cheaper)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4 (Higher Quality)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="brandTone">Brand Tone</Label>
                <Input
                  id="brandTone"
                  value={generationForm.brandTone}
                  onChange={(e) => setGenerationForm({ ...generationForm, brandTone: e.target.value })}
                  placeholder="Professional, casual, fun..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={generationForm.targetAudience}
                onChange={(e) => setGenerationForm({ ...generationForm, targetAudience: e.target.value })}
                placeholder="Young professionals, parents, tech enthusiasts..."
              />
            </div>

            <div>
              <Label htmlFor="callToAction">Call to Action</Label>
              <Input
                id="callToAction"
                value={generationForm.callToAction}
                onChange={(e) => setGenerationForm({ ...generationForm, callToAction: e.target.value })}
                placeholder="Visit our website, Sign up now, Learn more..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeImages"
                checked={generationForm.includeImages}
                onChange={(e) => setGenerationForm({ ...generationForm, includeImages: e.target.checked })}
                className="rounded"
                title="Include AI-generated images with the content"
                aria-describedby="includeImages-desc"
              />
              <Label htmlFor="includeImages">Generate images</Label>
              <span id="includeImages-desc" className="sr-only">
                Check this option to include AI-generated images along with the text content
              </span>
            </div>

            {selectedClient && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Brand Context</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedClient.description}
                </p>
                <div className="flex space-x-1 mt-2">
                  {selectedClient.brandColors.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={startGeneration}
              disabled={loading || !generationForm.clientId || !generationForm.prompt}
              className="w-full"
            > <span>{loading ? (</span><>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting Generation...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generation Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generation Progress
              {currentJob && (
                <Badge variant={currentJob.status === 'COMPLETED' ? 'default' : 'secondary'}>
                  {currentJob.status}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Track the AI content generation process
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentJob ? (
              <div className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(calculateProgress())}%
                    </span>
                  </div>
                  <Progress value={calculateProgress()} />
                </div>

                {/* Step Progress */}
                <div className="space-y-3">
                  {currentJob.steps.map((step, index) => (
                    <div key={step.step} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStepIcon(step.step)}
                        <div>
                          <p className="font-medium text-sm">{getStepTitle(step.step)}</p>
                          <p className="text-xs text-muted-foreground">
                            {step.tokensUsed > 0 && `${step.tokensUsed} tokens used`}
                            {step.error && (
                              <span className="text-error-600 ml-2">{step.error}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(step.status)}
                        {step.status === 'FAILED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => <span>regenerateStep(step.step)}
                          ></span><RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Job Info */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tokens Consumed</p>
                      <p className="font-medium">{currentJob.tokensConsumed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p className="font-medium">
                        {new Date(currentJob.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No generation in progress</p>
                <p className="text-sm">Start a new generation to see progress here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated Content Preview */}
      {currentJob && currentJob.status === 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Content
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" /> <span>Preview</span></Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" /> <span>Edit</span></Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" /> <span>Download</span></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                {currentJob.steps.map((step) => (
                  step.output && (
                    <div key={step.step} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{getStepTitle(step.step)}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => <span>regenerateStep(step.step)}
                        ></span><RotateCcw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                      <div className="text-sm">
                        {typeof step.output === 'string' ? (
                          <p>{step.output}</p>
                        ) : (
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentJob.steps
                    .filter(step => (step.step === 'BASE_IMAGE' || step.step === 'FINAL_DESIGN') && step.output)
                    .map((step) => (
                      <div key={step.step} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          {step.output?.imageUrl ? (
                            <img
                              src={step.output.imageUrl}
                              alt={getStepTitle(step.step)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium">{getStepTitle(step.step)}</p>
                          <p className="text-sm text-muted-foreground">
                            Generated at {new Date(step.executedAt!).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Job ID</Label>
                    <p className="text-sm font-mono">{currentJob.id}</p>
                  </div>
                  <div>
                    <Label>Total Tokens</Label>
                    <p className="text-sm">{currentJob.tokensConsumed}</p>
                  </div>
                  <div>
                    <Label>Started</Label>
                    <p className="text-sm">{new Date(currentJob.createdAt).toLocaleString()}</p>
                  </div>
                  {currentJob.completedAt && (
                    <div>
                      <Label>Completed</Label>
                      <p className="text-sm">{new Date(currentJob.completedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}