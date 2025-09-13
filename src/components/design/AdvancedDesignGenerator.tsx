'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Image, 
  Layers, 
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Wand2,
  Template,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  platform: string;
  thumbnailUrl: string;
  description: string;
  metadata: {
    style: string;
    industry: string[];
    difficulty: string;
  };
}

interface GeneratedAsset {
  type: 'product' | 'background' | 'composition';
  imageUrl: string;
  prompt: string;
}

interface DesignResult {
  jobId: string;
  templateId: string;
  finalImageUrl: string;
  thumbnailUrl: string;
  generatedAssets: GeneratedAsset[];
  metadata: {
    generationTime: number;
    totalCost: number;
    stepsCompleted: string[];
    tokensConsumed: number;
  };
}

export default function AdvancedDesignGenerator() {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [autoSelectTemplate, setAutoSelectTemplate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DesignResult | null>(null);

  // Form state
  const [designForm, setDesignForm] = useState({
    clientId: '',
    campaignId: '',
    platform: 'instagram',
    contentType: 'social_post',
    content: {
      headline: '',
      subheadline: '',
      body: '',
      cta: '',
      productImages: [] as string[]
    },
    customizations: {
      backgroundPrompt: '',
      productPrompt: '',
      style: ''
    }
  });

  useEffect(() => {
    fetchTemplates();
  }, [designForm.platform, designForm.contentType]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        `/api/design/generate?platform=${designForm.platform}&contentType=${designForm.contentType}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading templates');
    }
  };

  const generateDesign = async () => {
    if (!designForm.content.headline) {
      toast.error('Headline is required');
      return;
    }

    setLoading(true);
    setProgress(0);
    setCurrentStep('Initializing...');

    try {
      // Simulate progress updates
      const progressSteps = [
        { step: 'Selecting optimal template...', progress: 20 },
        { step: 'Generating product image...', progress: 40 },
        { step: 'Creating background...', progress: 60 },
        { step: 'Composing final design...', progress: 80 },
        { step: 'Finalizing...', progress: 100 }
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setCurrentStep(progressSteps[stepIndex].step);
          setProgress(progressSteps[stepIndex].progress);
          stepIndex++;
        }
      }, 1500);

      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...designForm,
          autoSelectTemplate,
          templateId: autoSelectTemplate ? undefined : selectedTemplate,
        }),
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setCurrentStep('Design completed!');
        setProgress(100);
        toast.success('Design generated successfully!');
      } else {
        throw new Error(data.error?.message || 'Failed to generate design');
      }
    } catch (error) {
      console.error('Design generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate design');
      setCurrentStep('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setProgress(0);
    setCurrentStep('');
    setDesignForm({
      ...designForm,
      content: {
        headline: '',
        subheadline: '',
        body: '',
        cta: '',
        productImages: []
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5" />
            <span>Advanced Design Generator</span>
          </CardTitle>
          <CardDescription>
            AI-powered design creation with intelligent template selection and image composition
          </CardDescription>
        </CardHeader>
      </Card>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Design Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={designForm.platform}
                      onValueChange={(value) => setDesignForm({ ...designForm, platform: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select
                      value={designForm.contentType}
                      onValueChange={(value) => setDesignForm({ ...designForm, contentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social_post">Social Post</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-select"
                    checked={autoSelectTemplate}
                    onCheckedChange={setAutoSelectTemplate}
                  />
                  <Label htmlFor="auto-select">Auto-select optimal template</Label>
                </div>

                {!autoSelectTemplate && (
                  <div>
                    <Label>Manual Template Selection</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {templates.map((template) => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all ${
                            selectedTemplate === template.id
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <CardContent className="p-3">
                            <img
                              src={template.thumbnailUrl}
                              alt={template.name}
                              className="w-full h-20 object-cover rounded mb-2"
                            />
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            <p className="text-xs text-gray-600">{template.description}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {template.metadata.style}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="headline">Headline *</Label>
                  <Input
                    id="headline"
                    value={designForm.content.headline}
                    onChange={(e) => setDesignForm({
                      ...designForm,
                      content: { ...designForm.content, headline: e.target.value }
                    })}
                    placeholder="Main message for your design"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {designForm.content.headline.length}/50 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="subheadline">Subheadline</Label>
                  <Input
                    id="subheadline"
                    value={designForm.content.subheadline}
                    onChange={(e) => setDesignForm({
                      ...designForm,
                      content: { ...designForm.content, subheadline: e.target.value }
                    })}
                    placeholder="Supporting message"
                    maxLength={80}
                  />
                </div>

                <div>
                  <Label htmlFor="body">Body Text</Label>
                  <Textarea
                    id="body"
                    value={designForm.content.body}
                    onChange={(e) => setDesignForm({
                      ...designForm,
                      content: { ...designForm.content, body: e.target.value }
                    })}
                    placeholder="Additional description or details"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="cta">Call to Action</Label>
                  <Input
                    id="cta"
                    value={designForm.content.cta}
                    onChange={(e) => setDesignForm({
                      ...designForm,
                      content: { ...designForm.content, cta: e.target.value }
                    })}
                    placeholder="Learn More, Shop Now, etc."
                    maxLength={20}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customizations</CardTitle>
                <CardDescription>
                  Optional prompts to customize image generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productPrompt">Product Image Prompt</Label>
                  <Textarea
                    id="productPrompt"
                    value={designForm.customizations.productPrompt}
                    onChange={(e) => setDesignForm({
                      ...designForm,
                      customizations: { ...designForm.customizations, productPrompt: e.target.value }
                    })}
                    placeholder="Describe the product or main subject for the image"
                  />
                </div>

                <div>
                  <Label htmlFor="backgroundPrompt">Background Prompt</Label>
                  <Textarea
                    id="backgroundPrompt"
                    value={designForm.customizations.backgroundPrompt}
                    onChange={(e) => setDesignForm({
                      ...designForm,
                      customizations: { ...designForm.customizations, backgroundPrompt: e.target.value }
                    })}
                    placeholder="Describe the desired background or atmosphere"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Progress value={progress} className="w-full" />
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{currentStep}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Template className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Ready to generate your design</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={generateDesign}
                  disabled={loading || !designForm.content.headline}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Design
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full"
                >
                  Reset Form
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Results Panel */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Design Generated Successfully!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="result" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="result">Final Design</TabsTrigger>
                <TabsTrigger value="assets">Generated Assets</TabsTrigger>
                <TabsTrigger value="metadata">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="result" className="space-y-4">
                <div className="text-center">
                  <img
                    src={result.finalImageUrl}
                    alt="Generated Design"
                    className="max-w-md mx-auto rounded-lg shadow-lg"
                  />
                  <div className="mt-4 space-x-2">
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="assets" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.generatedAssets.map((asset, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <img
                          src={asset.imageUrl}
                          alt={`Generated ${asset.type}`}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <Badge className="mb-2">{asset.type}</Badge>
                        <p className="text-sm text-gray-600">{asset.prompt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Generation Time</Label>
                    <p className="text-lg font-semibold">{result.metadata.generationTime}ms</p>
                  </div>
                  <div>
                    <Label>Total Cost</Label>
                    <p className="text-lg font-semibold">${result.metadata.totalCost.toFixed(4)}</p>
                  </div>
                  <div>
                    <Label>Tokens Consumed</Label>
                    <p className="text-lg font-semibold">{result.metadata.tokensConsumed}</p>
                  </div>
                  <div>
                    <Label>Steps Completed</Label>
                    <p className="text-lg font-semibold">{result.metadata.stepsCompleted.length}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Processing Steps</Label>
                  <div className="space-y-1 mt-2">
                    {result.metadata.stepsCompleted.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{step.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-center">
              <Button onClick={resetForm}>
                Generate Another Design
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}