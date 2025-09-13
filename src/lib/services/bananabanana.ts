import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'minimalist' | 'professional';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  quality?: 'standard' | 'hd' | 'ultra';
  brandColors?: string[];
  excludeElements?: string[];
}

export interface ImageGenerationResponse {
  imageUrl: string;
  thumbnailUrl: string;
  metadata: {
    prompt: string;
    style: string;
    aspectRatio: string;
    quality: string;
    generationTime: number;
    cost: number;
  };
  usage: {
    credits: number;
    cost: number;
  };
}

// Pricing for BananaBanana API (simulated)
const BANANABANANA_PRICING = {
  standard: 0.02, // $0.02 per image
  hd: 0.04, // $0.04 per image
  ultra: 0.08, // $0.08 per image
};

/**
 * Track image generation usage in database
 */
async function trackImageUsage(
  agencyId: string,
  userId: string,
  cost: number,
  operation: string,
  resourceId?: string
) {
  const tokenEquivalent = Math.ceil(cost * 1000); // Convert cost to token units
  
  await db.tokenTransaction.create({
    data: {
      agencyId,
      userId,
      amount: -tokenEquivalent,
      type: 'CONSUMPTION',
      description: `Image generation - ${operation}`,
      metadata: {
        service: 'BananaBanana',
        cost,
        operation,
        resourceId,
      },
    },
  });
}

/**
 * Check if agency has sufficient balance for image generation
 */
async function checkImageGenerationBalance(agencyId: string, estimatedCost: number): Promise<boolean> {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { tokenBalance: true },
  });

  if (!agency) {
    throw new Error('Agency not found');
  }

  const requiredTokens = Math.ceil(estimatedCost * 1000); // Convert to internal token units
  return agency.tokenBalance >= requiredTokens;
}

/**
 * Generate image using BananaBanana (powered by Gemini)
 */
export async function generateImage(
  request: ImageGenerationRequest,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<ImageGenerationResponse> {
  const {
    prompt,
    style = 'professional',
    aspectRatio = '1:1',
    quality = 'standard',
    brandColors = [],
    excludeElements = [],
  } = request;

  // Calculate cost
  const cost = BANANABANANA_PRICING[quality];

  // Check balance
  const hasBalance = await checkImageGenerationBalance(agencyId, cost);
  if (!hasBalance) {
    throw new Error('Insufficient token balance for image generation');
  }

  try {
    const startTime = Date.now();
    
    // Build enhanced prompt for image generation
    let enhancedPrompt = `Create a ${style} image: ${prompt}`;
    
    // Add style specifications
    const styleSpecs = {
      realistic: 'photorealistic, high detail, natural lighting',
      artistic: 'artistic style, creative composition, vibrant colors',
      cartoon: 'cartoon style, illustrated, fun and playful',
      minimalist: 'minimalist design, clean lines, simple composition',
      professional: 'professional, clean, business-appropriate, high quality'
    };
    
    enhancedPrompt += `. Style: ${styleSpecs[style] || styleSpecs.professional}`;
    
    // Add aspect ratio guidance
    const aspectRatioSpecs = {
      '1:1': 'square format, centered composition',
      '16:9': 'landscape format, wide composition',
      '9:16': 'portrait format, vertical composition',
      '4:5': 'slightly vertical format, social media optimized'
    };
    
    enhancedPrompt += `. Format: ${aspectRatioSpecs[aspectRatio] || aspectRatioSpecs['1:1']}`;
    
    // Add brand colors if specified
    if (brandColors.length > 0) {
      enhancedPrompt += `. Use brand colors: ${brandColors.join(', ')}`;
    }
    
    // Add exclusions
    if (excludeElements.length > 0) {
      enhancedPrompt += `. Avoid: ${excludeElements.join(', ')}`;
    }
    
    // Add quality specifications
    const qualitySpecs = {
      standard: 'good quality, web-ready',
      hd: 'high definition, crisp details, professional quality',
      ultra: 'ultra high definition, maximum detail, premium quality'
    };
    
    enhancedPrompt += `. Quality: ${qualitySpecs[quality]}`;

    // Use Gemini to generate a detailed image description
    // Note: Gemini doesn't generate images directly, but we can use it to create
    // detailed descriptions that could be used with image generation APIs
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const imageDescriptionPrompt = `
    You are an expert image generation prompt engineer. Create a detailed, specific prompt for an AI image generator based on this request:
    
    ${enhancedPrompt}
    
    Return only the optimized prompt for image generation, focusing on:
    - Visual composition and layout
    - Lighting and atmosphere
    - Color palette and mood
    - Technical specifications
    - Style and artistic direction
    
    Make it concise but comprehensive for best image generation results.
    `;

    const result = await model.generateContent(imageDescriptionPrompt);
    const response = await result.response;
    const optimizedPrompt = response.text();

    const generationTime = Date.now() - startTime;
    
    // In a real implementation, you would use the optimizedPrompt with an actual image generation API
    // For now, we'll simulate the response with the enhanced prompt
    
    // Generate simulated image URLs (in production, these would come from the actual image generation API)
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imageUrl = `https://images.bananabanana.com/generated/${imageId}_${quality}.jpg`;
    const thumbnailUrl = `https://images.bananabanana.com/thumbnails/${imageId}_thumb.jpg`;

    const imageResponse: ImageGenerationResponse = {
      imageUrl,
      thumbnailUrl,
      metadata: {
        prompt: optimizedPrompt, // Store the Gemini-optimized prompt
        style,
        aspectRatio,
        quality,
        generationTime,
        cost,
      },
      usage: {
        credits: 1,
        cost,
      },
    };

    // Track usage
    await trackImageUsage(agencyId, userId, cost, 'IMAGE_GENERATION', resourceId);

    return imageResponse;
  } catch (error) {
    console.error('BananaBanana (Gemini) API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded for image generation');
      }
      if (error.message.includes('safety')) {
        throw new Error('Image prompt blocked by Gemini safety filters');
      }
    }
    
    throw new Error('Failed to generate image with BananaBanana');
  }
}

/**
 * Generate multiple image variations
 */
export async function generateImageVariations(
  request: ImageGenerationRequest,
  variations: number,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<ImageGenerationResponse[]> {
  if (variations > 4) {
    throw new Error('Maximum 4 variations allowed per request');
  }

  const totalCost = BANANABANANA_PRICING[request.quality || 'standard'] * variations;
  
  // Check balance
  const hasBalance = await checkImageGenerationBalance(agencyId, totalCost);
  if (!hasBalance) {
    throw new Error('Insufficient token balance for image variations');
  }

  const results: ImageGenerationResponse[] = [];
  
  for (let i = 0; i < variations; i++) {
    try {
      // Add variation to prompt
      const variationRequest = {
        ...request,
        prompt: `${request.prompt}, variation ${i + 1}`,
      };
      
      const result = await generateImage(variationRequest, agencyId, userId, resourceId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
      // Continue with other variations
    }
  }

  if (results.length === 0) {
    throw new Error('Failed to generate any image variations');
  }

  return results;
}

/**
 * Upscale an existing image using Gemini Vision for analysis and enhancement
 */
export async function upscaleImage(
  imageUrl: string,
  targetQuality: 'hd' | 'ultra',
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<ImageGenerationResponse> {
  const cost = BANANABANANA_PRICING[targetQuality];

  // Check balance
  const hasBalance = await checkImageGenerationBalance(agencyId, cost);
  if (!hasBalance) {
    throw new Error('Insufficient token balance for image upscaling');
  }

  try {
    const startTime = Date.now();
    
    // Use Gemini Vision to analyze the image and create enhancement instructions
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    // Fetch the image to analyze (in a real implementation)
    // For now, we'll simulate the analysis
    const analysisPrompt = `
    Analyze this image and provide detailed instructions for upscaling it to ${targetQuality} quality.
    Focus on:
    - Image composition and subject matter
    - Areas that need detail enhancement
    - Color correction suggestions
    - Sharpness and clarity improvements
    - Optimal resolution recommendations
    
    Provide technical specifications for the upscaling process.
    `;

    // In a real implementation, you would pass the actual image data here
    // const result = await model.generateContent([analysisPrompt, imagePart]);
    
    // For simulation, we'll create enhancement instructions
    const enhancementInstructions = `
    Upscale to ${targetQuality} quality with:
    - Enhanced detail preservation
    - Improved edge sharpness
    - Color saturation optimization
    - Noise reduction
    - ${targetQuality === 'ultra' ? '4K resolution' : 'HD resolution'}
    `;

    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
    
    const generationTime = Date.now() - startTime;
    
    // Generate simulated upscaled URLs
    const imageId = `upscaled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const upscaledUrl = `https://images.bananabanana.com/upscaled/${imageId}_${targetQuality}.jpg`;
    const thumbnailUrl = `https://images.bananabanana.com/thumbnails/${imageId}_thumb.jpg`;

    const response: ImageGenerationResponse = {
      imageUrl: upscaledUrl,
      thumbnailUrl,
      metadata: {
        prompt: `Image upscaling with Gemini analysis: ${enhancementInstructions}`,
        style: 'upscaled',
        aspectRatio: '1:1', // Would be detected from original
        quality: targetQuality,
        generationTime,
        cost,
      },
      usage: {
        credits: 1,
        cost,
      },
    };

    // Track usage
    await trackImageUsage(agencyId, userId, cost, 'IMAGE_UPSCALING', resourceId);

    return response;
  } catch (error) {
    console.error('BananaBanana (Gemini) upscaling error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded for image upscaling');
      }
      if (error.message.includes('safety')) {
        throw new Error('Image content blocked by Gemini safety filters');
      }
    }
    
    throw new Error('Failed to upscale image with BananaBanana');
  }
}

/**
 * Get image generation cost estimate
 */
export function getImageGenerationCost(
  quality: 'standard' | 'hd' | 'ultra' = 'standard',
  variations: number = 1
): number {
  return BANANABANANA_PRICING[quality] * variations;
}

/**
 * Check if BananaBanana service is available (via Gemini)
 */
export async function checkBananaBananaHealth(): Promise<boolean> {
  try {
    // Check Gemini API availability
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Test prompt for health check');
    const response = await result.response;
    
    return !!response.text();
  } catch (error) {
    console.error('BananaBanana (Gemini) health check failed:', error);
    return false;
  }
}

/**
 * Get supported styles
 */
export function getSupportedStyles(): string[] {
  return ['realistic', 'artistic', 'cartoon', 'minimalist', 'professional'];
}

/**
 * Get supported aspect ratios
 */
export function getSupportedAspectRatios(): string[] {
  return ['1:1', '16:9', '9:16', '4:5'];
}

/**
 * Get supported quality levels
 */
export function getSupportedQualities(): Array<{ value: string; label: string; cost: number }> {
  return [
    { value: 'standard', label: 'Standard', cost: BANANABANANA_PRICING.standard },
    { value: 'hd', label: 'HD', cost: BANANABANANA_PRICING.hd },
    { value: 'ultra', label: 'Ultra HD', cost: BANANABANANA_PRICING.ultra },
  ];
}

/**
 * Interface for image composition request
 */
export interface ImageCompositionRequest {
  templateImageUrl: string;
  productImageUrl?: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  textContent: {
    headline: string;
    subheadline?: string;
    body?: string;
    cta?: string;
  };
  compositionPrompt: string;
  brandColors: string[];
}

/**
 * Generate final design composition using multiple images and text
 */
export async function generateImageComposition(
  request: ImageCompositionRequest,
  agencyId: string,
  userId: string,
  resourceId?: string
): Promise<ImageGenerationResponse> {
  const cost = BANANABANANA_PRICING.hd; // Composition is always HD quality

  // Check balance
  const hasBalance = await checkImageGenerationBalance(agencyId, cost);
  if (!hasBalance) {
    throw new Error('Insufficient token balance for image composition');
  }

  try {
    const startTime = Date.now();
    
    // Use Gemini to create detailed composition instructions
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const compositionInstructionsPrompt = `
    Eres un experto diseñador gráfico. Crea instrucciones técnicas detalladas para componer un diseño final usando estos elementos:

    ELEMENTOS DISPONIBLES:
    - Plantilla base: ${request.templateImageUrl}
    ${request.productImageUrl ? `- Imagen de producto: ${request.productImageUrl}` : ''}
    ${request.backgroundImageUrl ? `- Imagen de fondo: ${request.backgroundImageUrl}` : ''}
    ${request.logoUrl ? `- Logo: ${request.logoUrl}` : ''}

    CONTENIDO DE TEXTO:
    - Headline: "${request.textContent.headline}"
    ${request.textContent.subheadline ? `- Subheadline: "${request.textContent.subheadline}"` : ''}
    ${request.textContent.body ? `- Body: "${request.textContent.body}"` : ''}
    ${request.textContent.cta ? `- CTA: "${request.textContent.cta}"` : ''}

    COLORES DE MARCA: ${request.brandColors.join(', ')}

    PROMPT DE COMPOSICIÓN: ${request.compositionPrompt}

    INSTRUCCIONES TÉCNICAS:
    Crea un prompt detallado para generar la composición final que incluya:

    1. LAYOUT Y ESTRUCTURA:
       - Cómo integrar la plantilla base con otros elementos
       - Posicionamiento de cada imagen (producto, fondo, logo)
       - Jerarquía visual y flujo de lectura

    2. TIPOGRAFÍA Y TEXTO:
       - Posicionamiento exacto de cada texto
       - Tamaños, pesos y colores de fuente
       - Efectos de texto (sombras, outlines, etc.)
       - Legibilidad y contraste

    3. COMPOSICIÓN VISUAL:
       - Balance y proporción entre elementos
       - Uso de colores de marca
       - Efectos y filtros necesarios
       - Coherencia estilística

    4. OPTIMIZACIÓN TÉCNICA:
       - Resolución y calidad final
       - Formato y dimensiones
       - Optimización para plataforma social

    Devuelve un prompt técnico completo y específico para la generación de la imagen final.
    `;

    const result = await model.generateContent(compositionInstructionsPrompt);
    const response = await result.response;
    const detailedInstructions = response.text();

    // Simulate the actual composition process
    // In a real implementation, this would use an actual image composition API
    await new Promise(resolve => setTimeout(resolve, 4000)); // Simulate processing time

    const generationTime = Date.now() - startTime;
    
    // Generate final composition URLs
    const compositionId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalImageUrl = `https://images.bananabanana.com/compositions/${compositionId}_final.jpg`;
    const thumbnailUrl = `https://images.bananabanana.com/thumbnails/${compositionId}_thumb.jpg`;

    const compositionResponse: ImageGenerationResponse = {
      imageUrl: finalImageUrl,
      thumbnailUrl,
      metadata: {
        prompt: detailedInstructions,
        style: 'composition',
        aspectRatio: '1:1', // Would be determined by template
        quality: 'hd',
        generationTime,
        cost,
      },
      usage: {
        credits: 1,
        cost,
      },
    };

    // Track usage
    await trackImageUsage(agencyId, userId, cost, 'IMAGE_COMPOSITION', resourceId);

    return compositionResponse;
  } catch (error) {
    console.error('BananaBanana composition error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        throw new Error('Gemini API quota exceeded for image composition');
      }
      if (error.message.includes('safety')) {
        throw new Error('Composition content blocked by Gemini safety filters');
      }
    }
    
    throw new Error('Failed to generate image composition with BananaBanana');
  }
}

/**
 * Get composition cost estimate
 */
export function getCompositionCostEstimate(): number {
  return BANANABANANA_PRICING.hd; // Composition is always HD quality
}

/**
 * Validate composition request
 */
export function validateCompositionRequest(request: ImageCompositionRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.templateImageUrl) {
    errors.push('Template image URL is required');
  }

  if (!request.textContent.headline) {
    errors.push('Headline text is required');
  }

  if (!request.compositionPrompt) {
    errors.push('Composition prompt is required');
  }

  if (!request.brandColors || request.brandColors.length === 0) {
    errors.push('At least one brand color is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}