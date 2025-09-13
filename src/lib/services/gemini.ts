import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiGenerationRequest {
  prompt: string;
  model?: 'gemini-pro' | 'gemini-pro-vision';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiGenerationResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    model: string;
    temperature: number;
    finishReason: string;
    generationTime: number;
  };
}

// Pricing for Gemini API (per 1K tokens)
const GEMINI_PRICING = {
  'gemini-pro': {
    input: 0.0005, // $0.0005 per 1K input tokens
    output: 0.0015, // $0.0015 per 1K output tokens
  },
  'gemini-pro-vision': {
    input: 0.0025, // $0.0025 per 1K input tokens
    output: 0.0075, // $0.0075 per 1K output tokens
  },
};

/**
 * Calculate cost for Gemini API usage
 */
function calculateGeminiCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Track Gemini usage in database
 */
async function trackGeminiUsage(
  agencyId: string,
  userId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  cost: number,
  operation: string,
  resourceId?: string
) {
  const tokenEquivalent = Math.ceil(cost * 1000); // Convert cost to internal token units
  
  await db.tokenTransaction.create({
    data: {
      agencyId,
      userId,
      amount: -tokenEquivalent,
      type: 'CONSUMPTION',
      description: `Gemini ${model} - ${operation}`,
      metadata: {
        service: 'Gemini',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost,
        operation,
        resourceId,
      },
    },
  });
}

/**
 * Check if agency has sufficient balance for Gemini generation
 */
async function checkGeminiBalance(agencyId: string, estimatedCost: number): Promise<boolean> {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { tokenBalance: true },
  });

  if (!agency) {
    throw new Error('Agency not found');
  }

  const requiredTokens = Math.ceil(estimatedCost * 1000);
  return agency.tokenBalance >= requiredTokens;
}

/**
 * Generate content using Gemini API
 */
export async function generateWithGemini(
  request: GeminiGenerationRequest,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<GeminiGenerationResponse> {
  const {
    prompt,
    model = 'gemini-pro',
    temperature = 0.7,
    maxTokens = 1000,
    topP = 0.8,
    topK = 40,
  } = request;

  // Estimate cost (rough estimation based on prompt length)
  const estimatedPromptTokens = Math.ceil(prompt.length / 4); // Rough token estimation
  const estimatedCost = calculateGeminiCost(model, estimatedPromptTokens, maxTokens);

  // Check balance
  const hasBalance = await checkGeminiBalance(agencyId, estimatedCost);
  if (!hasBalance) {
    throw new Error('Insufficient token balance for Gemini generation');
  }

  try {
    const startTime = Date.now();
    
    // Get the generative model
    const geminiModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature,
        topP,
        topK,
        maxOutputTokens: maxTokens,
      },
    });

    // Generate content
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    const generationTime = Date.now() - startTime;

    // Calculate actual usage (Gemini doesn't provide token counts directly)
    const actualPromptTokens = Math.ceil(prompt.length / 4);
    const actualCompletionTokens = Math.ceil(content.length / 4);
    const actualCost = calculateGeminiCost(model, actualPromptTokens, actualCompletionTokens);

    const geminiResponse: GeminiGenerationResponse = {
      content,
      usage: {
        promptTokens: actualPromptTokens,
        completionTokens: actualCompletionTokens,
        totalTokens: actualPromptTokens + actualCompletionTokens,
        cost: actualCost,
      },
      metadata: {
        model,
        temperature,
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        generationTime,
      },
    };

    // Track usage
    await trackGeminiUsage(
      agencyId,
      userId,
      model,
      actualPromptTokens,
      actualCompletionTokens,
      actualCost,
      'TEXT_GENERATION',
      resourceId
    );

    return geminiResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded');
      }
      if (error.message.includes('safety')) {
        throw new Error('Content blocked by Gemini safety filters');
      }
    }
    
    throw new Error('Failed to generate content with Gemini');
  }
}

/**
 * Generate content with vision capabilities (for image analysis)
 */
export async function generateWithGeminiVision(
  prompt: string,
  imageData: string, // Base64 encoded image
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<GeminiGenerationResponse> {
  const model = 'gemini-pro-vision';
  
  // Estimate cost
  const estimatedPromptTokens = Math.ceil(prompt.length / 4) + 258; // Add tokens for image processing
  const estimatedCost = calculateGeminiCost(model, estimatedPromptTokens, 1000);

  // Check balance
  const hasBalance = await checkGeminiBalance(agencyId, estimatedCost);
  if (!hasBalance) {
    throw new Error('Insufficient token balance for Gemini Vision generation');
  }

  try {
    const startTime = Date.now();
    
    const geminiModel = genAI.getGenerativeModel({ model });

    // Prepare image part
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: 'image/jpeg', // Adjust based on actual image type
      },
    };

    const result = await geminiModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const content = response.text();

    const generationTime = Date.now() - startTime;

    // Calculate actual usage
    const actualPromptTokens = Math.ceil(prompt.length / 4) + 258; // Image processing tokens
    const actualCompletionTokens = Math.ceil(content.length / 4);
    const actualCost = calculateGeminiCost(model, actualPromptTokens, actualCompletionTokens);

    const geminiResponse: GeminiGenerationResponse = {
      content,
      usage: {
        promptTokens: actualPromptTokens,
        completionTokens: actualCompletionTokens,
        totalTokens: actualPromptTokens + actualCompletionTokens,
        cost: actualCost,
      },
      metadata: {
        model,
        temperature: 0.4, // Default for vision model
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        generationTime,
      },
    };

    // Track usage
    await trackGeminiUsage(
      agencyId,
      userId,
      model,
      actualPromptTokens,
      actualCompletionTokens,
      actualCost,
      'VISION_GENERATION',
      resourceId
    );

    return geminiResponse;
  } catch (error) {
    console.error('Gemini Vision API error:', error);
    throw new Error('Failed to generate content with Gemini Vision');
  }
}

/**
 * Get cost estimate for Gemini generation
 */
export function getGeminiCostEstimate(
  prompt: string,
  model: 'gemini-pro' | 'gemini-pro-vision' = 'gemini-pro',
  maxTokens: number = 1000
): number {
  const promptTokens = Math.ceil(prompt.length / 4);
  const imageTokens = model === 'gemini-pro-vision' ? 258 : 0;
  
  return calculateGeminiCost(model, promptTokens + imageTokens, maxTokens);
}

/**
 * Check if Gemini service is available
 */
export async function checkGeminiHealth(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    
    return !!response.text();
  } catch (error) {
    console.error('Gemini health check failed:', error);
    return false;
  }
}

/**
 * Get available Gemini models
 */
export function getAvailableGeminiModels(): Array<{ value: string; label: string; description: string }> {
  return [
    {
      value: 'gemini-pro',
      label: 'Gemini Pro',
      description: 'Best for text generation and analysis',
    },
    {
      value: 'gemini-pro-vision',
      label: 'Gemini Pro Vision',
      description: 'Best for image analysis and multimodal tasks',
    },
  ];
}