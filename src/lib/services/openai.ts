import OpenAI from 'openai';
import { db } from '@/lib/db';
import { TokenConsumptionService } from './token-consumption';
import { checkTokenBalance } from '../database-utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerationContext {
  clientId: string;
  campaignId: string;
  brandName: string;
  industry?: string;
  targetAudience?: string;
  campaignGoals?: string;
  brandGuidelines?: string;
  brandAssets?: Array<{
    type: string;
    name: string;
    url: string;
    metadata?: any;
  }>;
}

export interface ContentGenerationRequest {
  step: 'IDEA' | 'COPY_DESIGN' | 'COPY_PUBLICATION' | 'BASE_IMAGE' | 'FINAL_DESIGN';
  context: GenerationContext;
  previousSteps?: Record<string, any>;
  customPrompt?: string;
  platforms?: string[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number; // in USD
}

// Token pricing (as of 2024 - update as needed)
const TOKEN_PRICING = {
  'gpt-4': {
    prompt: 0.03 / 1000, // $0.03 per 1K prompt tokens
    completion: 0.06 / 1000, // $0.06 per 1K completion tokens
  },
  'gpt-3.5-turbo': {
    prompt: 0.0015 / 1000, // $0.0015 per 1K prompt tokens
    completion: 0.002 / 1000, // $0.002 per 1K completion tokens
  },
};

/**
 * Calculate cost based on token usage
 */
function calculateCost(usage: OpenAI.Completions.CompletionUsage, model: string): number {
  const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || TOKEN_PRICING['gpt-3.5-turbo'];
  
  const promptCost = usage.prompt_tokens * pricing.prompt;
  const completionCost = usage.completion_tokens * pricing.completion;
  
  return promptCost + completionCost;
}

/**
 * Track token usage using the centralized service
 */
async function trackTokenUsage(
  agencyId: string,
  userId: string,
  usage: TokenUsage,
  operation: string,
  resourceId?: string
) {
  const tokenCosts = TokenConsumptionService.getTokenCosts();
  let tokenAmount = 0;

  // Map operation to token cost
  switch (operation) {
    case 'IDEA_GENERATION':
      tokenAmount = tokenCosts.IDEA_GENERATION;
      break;
    case 'COPY_DESIGN':
      tokenAmount = tokenCosts.COPY_DESIGN;
      break;
    case 'COPY_PUBLICATION':
      tokenAmount = tokenCosts.COPY_PUBLICATION;
      break;
    default:
      tokenAmount = Math.ceil(usage.totalTokens / 100); // Fallback calculation
  }

  await TokenConsumptionService.consumeTokens({
    agencyId,
    userId,
    amount: tokenAmount,
    description: `AI ${operation}`,
    reference: resourceId,
    metadata: {
      openaiUsage: usage,
      operation,
    },
  });
}

/**
 * Generate content idea based on campaign context
 */
export async function generateContentIdea(
  request: ContentGenerationRequest,
  agencyId: string,
  userId: string
): Promise<{ idea: string; usage: TokenUsage }> {
  const { context } = request;

  // Check token balance
  const requiredTokens = TokenConsumptionService.getTokenCosts().IDEA_GENERATION;
  const hasBalance = await TokenConsumptionService.checkTokenBalance(agencyId, requiredTokens);
  if (!hasBalance) {
    throw new Error('Insufficient token balance');
  }

  const prompt = `
You are a creative social media content strategist. Generate a compelling content idea for a social media post.

Brand Context:
- Brand: ${context.brandName}
- Industry: ${context.industry || 'Not specified'}
- Target Audience: ${context.targetAudience || 'General audience'}
- Campaign Goals: ${context.campaignGoals || 'Increase engagement'}
- Brand Guidelines: ${context.brandGuidelines || 'Follow brand voice and tone'}

Requirements:
- Create an engaging, original content idea
- Align with brand voice and campaign goals
- Consider the target audience
- Be platform-appropriate for social media
- Include a brief explanation of why this idea would work

Format your response as JSON:
{
  "idea": "The main content idea/concept",
  "explanation": "Why this idea would work for the brand and audience",
  "suggestedTone": "The recommended tone (e.g., professional, casual, humorous)",
  "keyMessages": ["key message 1", "key message 2", "key message 3"]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional social media content strategist. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      cost: calculateCost(completion.usage!, 'gpt-3.5-turbo'),
    };

    // Track token usage
    await trackTokenUsage(agencyId, userId, usage, 'CONTENT_IDEA', context.campaignId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // Fallback if JSON parsing fails
      parsedContent = {
        idea: content,
        explanation: 'Generated content idea',
        suggestedTone: 'professional',
        keyMessages: [],
      };
    }

    return {
      idea: JSON.stringify(parsedContent),
      usage,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate content idea');
  }
}

/**
 * Generate copy for design phase
 */
export async function generateCopyDesign(
  request: ContentGenerationRequest,
  agencyId: string,
  userId: string
): Promise<{ copy: string; usage: TokenUsage }> {
  const { context, previousSteps } = request;
  const idea = previousSteps?.IDEA;

  // Check token balance
  const estimatedTokens = 1200;
  const hasBalance = await checkTokenBalance(agencyId, estimatedTokens);
  if (!hasBalance) {
    throw new Error('Insufficient token balance');
  }

  const prompt = `
You are a professional copywriter specializing in social media content. Create compelling copy based on the provided content idea.

Brand Context:
- Brand: ${context.brandName}
- Industry: ${context.industry || 'Not specified'}
- Target Audience: ${context.targetAudience || 'General audience'}
- Brand Guidelines: ${context.brandGuidelines || 'Follow brand voice and tone'}

Content Idea:
${idea || 'Create engaging social media content'}

Requirements:
- Write engaging, action-oriented copy
- Include relevant hashtags
- Keep it concise but impactful
- Align with brand voice
- Include a clear call-to-action
- Make it suitable for multiple social platforms

Format your response as JSON:
{
  "headline": "Attention-grabbing headline",
  "body": "Main copy text",
  "callToAction": "Clear call-to-action",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "tone": "The tone used (professional, casual, etc.)",
  "platforms": ["FACEBOOK", "INSTAGRAM", "LINKEDIN"]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional copywriter. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      cost: calculateCost(completion.usage!, 'gpt-3.5-turbo'),
    };

    // Track token usage
    await trackTokenUsage(agencyId, userId, usage, 'COPY_DESIGN', context.campaignId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return {
      copy: content,
      usage,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate copy design');
  }
}

/**
 * Generate final publication copy
 */
export async function generateCopyPublication(
  request: ContentGenerationRequest,
  agencyId: string,
  userId: string
): Promise<{ copy: string; usage: TokenUsage }> {
  const { context, previousSteps, platforms = ['FACEBOOK'] } = request;
  const idea = previousSteps?.IDEA;
  const copyDesign = previousSteps?.COPY_DESIGN;

  // Check token balance
  const estimatedTokens = 1000;
  const hasBalance = await checkTokenBalance(agencyId, estimatedTokens);
  if (!hasBalance) {
    throw new Error('Insufficient token balance');
  }

  const prompt = `
You are a social media expert. Create platform-optimized publication copy based on the design copy.

Brand Context:
- Brand: ${context.brandName}
- Target Platforms: ${platforms.join(', ')}

Previous Steps:
- Idea: ${idea || 'Not provided'}
- Design Copy: ${copyDesign || 'Not provided'}

Requirements:
- Optimize for the specified platforms: ${platforms.join(', ')}
- Keep character limits in mind
- Include platform-appropriate hashtags
- Maintain brand voice
- Include emojis where appropriate
- Make it ready to publish

Create separate versions for each platform if needed.

Format your response as JSON:
{
  "platforms": {
    "FACEBOOK": {
      "content": "Facebook-optimized content",
      "hashtags": ["#hashtag1", "#hashtag2"]
    },
    "INSTAGRAM": {
      "content": "Instagram-optimized content",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
    },
    "LINKEDIN": {
      "content": "LinkedIn-optimized content",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  },
  "generalContent": "Platform-agnostic version if applicable"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a social media expert. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      cost: calculateCost(completion.usage!, 'gpt-3.5-turbo'),
    };

    // Track token usage
    await trackTokenUsage(agencyId, userId, usage, 'COPY_PUBLICATION', context.campaignId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return {
      copy: content,
      usage,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate publication copy');
  }
}

/**
 * Generate image prompt for DALL-E or external image generation
 */
export async function generateImagePrompt(
  request: ContentGenerationRequest,
  agencyId: string,
  userId: string
): Promise<{ prompt: string; usage: TokenUsage }> {
  const { context, previousSteps } = request;
  const idea = previousSteps?.IDEA;
  const copyDesign = previousSteps?.COPY_DESIGN;

  // Check token balance
  const estimatedTokens = 800;
  const hasBalance = await checkTokenBalance(agencyId, estimatedTokens);
  if (!hasBalance) {
    throw new Error('Insufficient token balance');
  }

  const prompt = `
You are a creative director specializing in visual content for social media. Create a detailed image generation prompt.

Brand Context:
- Brand: ${context.brandName}
- Industry: ${context.industry || 'Not specified'}
- Brand Guidelines: ${context.brandGuidelines || 'Professional and clean'}

Content Context:
- Idea: ${idea || 'Not provided'}
- Copy: ${copyDesign || 'Not provided'}

Requirements:
- Create a detailed, specific image prompt
- Consider brand aesthetics and industry
- Make it suitable for social media
- Include style, composition, and mood
- Avoid copyrighted elements
- Keep it professional and on-brand

Format your response as JSON:
{
  "prompt": "Detailed image generation prompt",
  "style": "Visual style description",
  "mood": "Intended mood/feeling",
  "composition": "Composition guidelines",
  "colors": "Suggested color palette",
  "elements": ["key visual element 1", "key visual element 2"]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a creative director. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const usage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      cost: calculateCost(completion.usage!, 'gpt-3.5-turbo'),
    };

    // Track token usage
    await trackTokenUsage(agencyId, userId, usage, 'IMAGE_PROMPT', context.campaignId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    return {
      prompt: content,
      usage,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate image prompt');
  }
}

/**
 * Get estimated token usage for a request
 */
export function estimateTokenUsage(request: ContentGenerationRequest): number {
  const baseEstimates = {
    IDEA: 1000,
    COPY_DESIGN: 1200,
    COPY_PUBLICATION: 1000,
    BASE_IMAGE: 800,
    FINAL_DESIGN: 600,
  };

  return baseEstimates[request.step] || 1000;
}

/**
 * Check if OpenAI service is available
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI health check failed:', error);
    return false;
  }
}