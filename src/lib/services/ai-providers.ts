import { generateContent as generateWithOpenAI } from './openai';
import { generateWithGemini, type GeminiGenerationRequest } from './gemini';

export interface AIGenerationRequest {
  prompt: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  targetAudience?: string;
  brandGuidelines?: string;
  aiProvider?: 'openai' | 'gemini';
  model?: string;
}

export interface AIGenerationResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    model: string;
    platform: string;
    tone: string;
    length: string;
    generationTime: number;
    provider: 'openai' | 'gemini';
  };
}

/**
 * Build optimized prompt for content generation
 */
function buildContentPrompt(request: AIGenerationRequest): string {
  const {
    prompt,
    platform,
    tone = 'professional',
    length = 'medium',
    includeHashtags = true,
    includeEmojis = false,
    targetAudience,
    brandGuidelines,
  } = request;

  let systemPrompt = `You are an expert social media content creator. Create engaging content for ${platform}.`;
  
  // Platform-specific guidelines
  const platformGuidelines = {
    twitter: 'Keep it concise (max 280 characters), use relevant hashtags, make it engaging and shareable.',
    linkedin: 'Professional tone, thought leadership, industry insights, use relevant hashtags.',
    facebook: 'Engaging, conversational, community-focused, can be longer form.',
    instagram: 'Visual-first mindset, lifestyle-focused, use emojis and hashtags strategically.',
  };

  systemPrompt += ` ${platformGuidelines[platform]}`;

  // Length guidelines
  const lengthGuidelines = {
    short: platform === 'twitter' ? '100-150 characters' : '1-2 sentences',
    medium: platform === 'twitter' ? '150-250 characters' : '2-3 sentences',
    long: platform === 'twitter' ? '250-280 characters' : '3-5 sentences',
  };

  systemPrompt += ` Target length: ${lengthGuidelines[length]}.`;

  // Tone guidelines
  systemPrompt += ` Tone should be ${tone}.`;

  if (targetAudience) {
    systemPrompt += ` Target audience: ${targetAudience}.`;
  }

  if (brandGuidelines) {
    systemPrompt += ` Brand guidelines: ${brandGuidelines}.`;
  }

  if (includeHashtags) {
    systemPrompt += ` Include 3-5 relevant hashtags.`;
  }

  if (includeEmojis) {
    systemPrompt += ` Use appropriate emojis to enhance engagement.`;
  }

  systemPrompt += `\n\nContent request: ${prompt}`;

  return systemPrompt;
}

/**
 * Get max tokens based on platform and length
 */
function getMaxTokensForPlatform(platform: string, length?: string): number {
  const baseTokens = {
    twitter: { short: 100, medium: 150, long: 200 },
    linkedin: { short: 200, medium: 400, long: 600 },
    facebook: { short: 300, medium: 500, long: 800 },
    instagram: { short: 250, medium: 400, long: 600 },
  };

  return baseTokens[platform as keyof typeof baseTokens]?.[length as keyof typeof baseTokens.twitter] || 400;
}

/**
 * Generate content using specified AI provider
 */
export async function generateAIContent(
  request: AIGenerationRequest,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<AIGenerationResponse> {
  const { aiProvider = 'openai' } = request;

  if (aiProvider === 'gemini') {
    return generateContentWithGemini(request, agencyId, userId, resourceId);
  }
  
  return generateContentWithOpenAI(request, agencyId, userId, resourceId);
}

/**
 * Generate content using Gemini
 */
async function generateContentWithGemini(
  request: AIGenerationRequest,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<AIGenerationResponse> {
  const prompt = buildContentPrompt(request);
  
  const geminiRequest: GeminiGenerationRequest = {
    prompt,
    model: (request.model as 'gemini-pro') || 'gemini-pro',
    temperature: 0.7,
    maxTokens: getMaxTokensForPlatform(request.platform, request.length),
  };

  try {
    const geminiResponse = await generateWithGemini(geminiRequest, agencyId, userId, resourceId);
    
    return {
      content: geminiResponse.content,
      usage: {
        promptTokens: geminiResponse.usage.promptTokens,
        completionTokens: geminiResponse.usage.completionTokens,
        totalTokens: geminiResponse.usage.totalTokens,
        cost: geminiResponse.usage.cost,
      },
      metadata: {
        model: geminiResponse.metadata.model,
        platform: request.platform,
        tone: request.tone || 'professional',
        length: request.length || 'medium',
        generationTime: geminiResponse.metadata.generationTime,
        provider: 'gemini',
      },
    };
  } catch (error) {
    console.error('Gemini content generation error:', error);
    throw error;
  }
}

/**
 * Generate content using OpenAI (legacy support)
 */
async function generateContentWithOpenAI(
  request: AIGenerationRequest,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<AIGenerationResponse> {
  // Convert to OpenAI format
  const openAIRequest = {
    step: 'COPY_PUBLICATION' as const,
    context: {
      clientId: resourceId || 'default',
      campaignId: resourceId || 'default',
      brandName: 'Brand',
      targetAudience: request.targetAudience,
      brandGuidelines: request.brandGuidelines,
    },
    customPrompt: buildContentPrompt(request),
    platforms: [request.platform],
  };

  try {
    const openAIResponse = await generateWithOpenAI(openAIRequest, agencyId, userId);
    
    return {
      content: openAIResponse.content,
      usage: {
        promptTokens: openAIResponse.usage.promptTokens,
        completionTokens: openAIResponse.usage.completionTokens,
        totalTokens: openAIResponse.usage.totalTokens,
        cost: openAIResponse.usage.cost,
      },
      metadata: {
        model: openAIResponse.metadata.model,
        platform: request.platform,
        tone: request.tone || 'professional',
        length: request.length || 'medium',
        generationTime: openAIResponse.metadata.generationTime,
        provider: 'openai',
      },
    };
  } catch (error) {
    console.error('OpenAI content generation error:', error);
    throw error;
  }
}

/**
 * Get available AI providers
 */
export function getAvailableAIProviders(): Array<{
  value: string;
  label: string;
  description: string;
  models: Array<{ value: string; label: string }>;
}> {
  return [
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'GPT-4 and GPT-3.5 models for high-quality content generation',
      models: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      ],
    },
    {
      value: 'gemini',
      label: 'Google Gemini',
      description: 'Google\'s advanced AI models for creative content generation',
      models: [
        { value: 'gemini-pro', label: 'Gemini Pro' },
        { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
      ],
    },
  ];
}

/**
 * Get cost estimate for content generation
 */
export function getContentGenerationCostEstimate(
  request: AIGenerationRequest
): { openai: number; gemini: number } {
  const prompt = buildContentPrompt(request);
  const promptTokens = Math.ceil(prompt.length / 4);
  const maxTokens = getMaxTokensForPlatform(request.platform, request.length);

  // OpenAI pricing (GPT-3.5-turbo)
  const openaiCost = (promptTokens * 0.0015 / 1000) + (maxTokens * 0.002 / 1000);

  // Gemini pricing
  const geminiCost = (promptTokens * 0.0005 / 1000) + (maxTokens * 0.0015 / 1000);

  return {
    openai: openaiCost,
    gemini: geminiCost,
  };
}

/**
 * Check health of all AI providers
 */
export async function checkAIProvidersHealth(): Promise<{
  openai: boolean;
  gemini: boolean;
}> {
  const [openaiHealth, geminiHealth] = await Promise.allSettled([
    // Simple health check for OpenAI
    fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }).then(res => res.ok),
    // Gemini health check
    import('./gemini').then(({ checkGeminiHealth }) => checkGeminiHealth()),
  ]);

  return {
    openai: openaiHealth.status === 'fulfilled' ? openaiHealth.value : false,
    gemini: geminiHealth.status === 'fulfilled' ? geminiHealth.value : false,
  };
}