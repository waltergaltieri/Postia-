import { db } from '@/lib/db';
import { generateWithGemini } from './gemini';
import { generateAIContent } from './ai-providers';
import { selectOptimalTemplate, generateFinalDesign } from './template-engine';
import { generateImage } from './bananabanana';

export interface CampaignContentRequest {
  campaignId: string;
  clientId: string;
  contentCount: number; // Número de publicaciones a generar
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  platforms: string[];
  contentMix: {
    textOnly: number;    // % de posts solo texto
    singleImage: number; // % de posts con imagen
    carousel: number;    // % de carruseles
    video: number;       // % de videos (futuro)
  };
  brandGuidelines?: {
    tone: string;
    style: string;
    colors: string[];
    topics: string[];
    avoidTopics: string[];
  };
}

export interface ContentIdea {
  id: string;
  title: string;
  concept: string;
  contentType: 'text_only' | 'single_image' | 'carousel' | 'video';
  platform: string;
  scheduledDate: Date;
  topics: string[];
  tone: string;
  objective: 'awareness' | 'engagement' | 'conversion' | 'education';
  priority: 'high' | 'medium' | 'low';
}

export interface DevelopedContent {
  ideaId: string;
  contentType: 'text_only' | 'single_image' | 'carousel';
  platform: string;
  
  // Textos desarrollados
  copy: {
    mainText: string;      // Copy principal para la publicación
    designText?: {         // Textos para el diseño (si aplica)
      headline?: string;
      subheadline?: string;
      cta?: string;
    };
    hashtags: string[];
    caption?: string;
  };
  
  // Especificaciones visuales (si aplica)
  visualSpecs?: {
    templateId?: string;
    imagePrompts?: string[];
    designInstructions?: string;
    carouselSlides?: Array<{
      slideNumber: number;
      content: string;
      imagePrompt?: string;
    }>;
  };
  
  // Metadatos
  metadata: {
    estimatedCost: number;
    estimatedEngagement: number;
    brandCompliance: number;
    qualityScore: number;
  };
}

export interface FinalPublication {
  id: string;
  ideaId: string;
  campaignId: string;
  platform: string;
  contentType: 'text_only' | 'single_image' | 'carousel';
  scheduledDate: Date;
  
  // Contenido final
  content: {
    text: string;
    hashtags: string[];
    images?: string[];      // URLs de imágenes generadas
    designAssets?: string[]; // URLs de diseños finales
  };
  
  // Estado
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  
  // Métricas de generación
  generationMetrics: {
    totalCost: number;
    generationTime: number;
    aiProvidersUsed: string[];
    assetsGenerated: number;
  };
}

/**
 * PASO 1: Generación de Ideas para Campaña
 */
export async function generateCampaignIdeas(
  request: CampaignContentRequest,
  agencyId: string,
  userId: string
): Promise<ContentIdea[]> {
  
  // Obtener información de campaña y cliente
  const campaign = await db.campaign.findUnique({
    where: { id: request.campaignId },
    include: { client: true }
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const ideaGenerationPrompt = `
  Eres un estratega de contenido experto. Genera ${request.contentCount} ideas de contenido para esta campaña:

  INFORMACIÓN DE LA CAMPAÑA:
  - Nombre: ${campaign.name}
  - Objetivo: ${campaign.objective}
  - Cliente: ${campaign.client.name}
  - Industria: ${campaign.client.settings?.industry || 'general'}
  - Audiencia: ${campaign.client.settings?.targetAudience}
  - Duración: ${request.dateRange.startDate.toDateString()} - ${request.dateRange.endDate.toDateString()}

  PLATAFORMAS: ${request.platforms.join(', ')}

  MIX DE CONTENIDO REQUERIDO:
  - Solo texto: ${request.contentMix.textOnly}%
  - Imagen única: ${request.contentMix.singleImage}%
  - Carrusel: ${request.contentMix.carousel}%
  - Video: ${request.contentMix.video}%

  BRAND GUIDELINES:
  - Tono: ${request.brandGuidelines?.tone || 'profesional'}
  - Estilo: ${request.brandGuidelines?.style || 'moderno'}
  - Temas preferidos: ${request.brandGuidelines?.topics?.join(', ') || 'variados'}
  - Evitar: ${request.brandGuidelines?.avoidTopics?.join(', ') || 'ninguno específico'}

  INSTRUCCIONES:
  1. Crea ideas diversas y estratégicamente distribuidas
  2. Varía los objetivos: awareness, engagement, conversion, education
  3. Distribuye el contenido equilibradamente en el tiempo
  4. Asegura coherencia con la marca y objetivos
  5. Considera tendencias y estacionalidad
  6. Incluye diferentes niveles de prioridad

  Para cada idea, proporciona:
  - Título descriptivo
  - Concepto detallado (2-3 líneas)
  - Tipo de contenido (text_only, single_image, carousel)
  - Plataforma principal
  - Fecha sugerida
  - Temas/categorías
  - Tono específico
  - Objetivo principal
  - Prioridad (high/medium/low)

  Formato de respuesta: JSON array con las ideas estructuradas.
  `;

  try {
    const ideasResult = await generateWithGemini({
      prompt: ideaGenerationPrompt,
      model: 'gemini-pro',
      temperature: 0.8, // Más creatividad para ideas
    }, agencyId, userId);

    // Parsear y estructurar las ideas
    const ideas = JSON.parse(ideasResult.content);
    
    // Distribuir fechas automáticamente
    const distributedIdeas = distributeContentDates(ideas, request.dateRange, request.platforms);
    
    return distributedIdeas;
    
  } catch (error) {
    console.error('Error generating campaign ideas:', error);
    throw new Error('Failed to generate campaign ideas');
  }
}

/**
 * PASO 2: Desarrollo de Contenido para cada Idea
 */
export async function developContentIdeas(
  ideas: ContentIdea[],
  campaignId: string,
  agencyId: string,
  userId: string
): Promise<DevelopedContent[]> {
  
  const developedContents: DevelopedContent[] = [];
  
  // Obtener información de campaña para contexto
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: { client: true }
  });

  for (const idea of ideas) {
    try {
      const developedContent = await developSingleIdea(idea, campaign!, agencyId, userId);
      developedContents.push(developedContent);
    } catch (error) {
      console.error(`Error developing idea ${idea.id}:`, error);
      // Continuar con las demás ideas
    }
  }
  
  return developedContents;
}

/**
 * Desarrolla una idea individual en contenido completo
 */
async function developSingleIdea(
  idea: ContentIdea,
  campaign: any,
  agencyId: string,
  userId: string
): Promise<DevelopedContent> {
  
  const developmentPrompt = `
  Desarrolla completamente esta idea de contenido:

  IDEA:
  - Título: ${idea.title}
  - Concepto: ${idea.concept}
  - Tipo: ${idea.contentType}
  - Plataforma: ${idea.platform}
  - Objetivo: ${idea.objective}
  - Tono: ${idea.tone}

  CONTEXTO DE MARCA:
  - Cliente: ${campaign.client.name}
  - Industria: ${campaign.client.settings?.industry}
  - Audiencia: ${campaign.client.settings?.targetAudience}
  - Guidelines: ${campaign.client.settings?.brandGuidelines}

  DESARROLLO REQUERIDO:

  1. COPY PRINCIPAL:
     - Texto principal para la publicación (optimizado para ${idea.platform})
     - Hashtags relevantes (5-10)
     - Caption adicional si es necesario

  ${idea.contentType !== 'text_only' ? `
  2. TEXTOS PARA DISEÑO:
     - Headline principal (máx 6 palabras)
     - Subheadline si es necesario (máx 12 palabras)
     - Call-to-action (máx 3 palabras)

  3. ESPECIFICACIONES VISUALES:
     - Descripción detallada para generación de imagen
     - Estilo visual recomendado
     - Elementos que debe incluir/evitar
     ${idea.contentType === 'carousel' ? '- Contenido para cada slide (3-5 slides)' : ''}
  ` : ''}

  4. OPTIMIZACIÓN:
     - Adaptado específicamente para ${idea.platform}
     - Alineado con objetivo de ${idea.objective}
     - Tono ${idea.tone} consistente

  Responde en formato JSON estructurado con todos los elementos desarrollados.
  `;

  const developmentResult = await generateWithGemini({
    prompt: developmentPrompt,
    model: 'gemini-pro',
    temperature: 0.7,
  }, agencyId, userId);

  const developedData = JSON.parse(developmentResult.content);

  // Si necesita contenido visual, seleccionar plantilla
  let visualSpecs;
  if (idea.contentType !== 'text_only') {
    const template = await selectOptimalTemplate({
      contentType: idea.contentType,
      platform: idea.platform,
      brandStyle: campaign.client.settings?.brandStyle,
      industry: campaign.client.settings?.industry,
      campaignObjective: idea.objective,
      targetAudience: campaign.client.settings?.targetAudience,
      brandColors: campaign.client.settings?.brandColors
    }, agencyId, userId);

    visualSpecs = {
      templateId: template.id,
      imagePrompts: developedData.visualSpecs?.imagePrompts || [],
      designInstructions: developedData.visualSpecs?.designInstructions,
      carouselSlides: developedData.visualSpecs?.carouselSlides
    };
  }

  return {
    ideaId: idea.id,
    contentType: idea.contentType,
    platform: idea.platform,
    copy: developedData.copy,
    visualSpecs,
    metadata: {
      estimatedCost: calculateEstimatedCost(idea.contentType),
      estimatedEngagement: 0, // Se calculará con ML en el futuro
      brandCompliance: 0.95,  // Se evaluará automáticamente
      qualityScore: 0.9       // Se evaluará automáticamente
    }
  };
}

/**
 * PASO 3: Generación de Publicaciones Finales
 */
export async function generateFinalPublications(
  developedContents: DevelopedContent[],
  campaignId: string,
  agencyId: string,
  userId: string
): Promise<FinalPublication[]> {
  
  const finalPublications: FinalPublication[] = [];
  
  for (const content of developedContents) {
    try {
      const publication = await generateSinglePublication(content, campaignId, agencyId, userId);
      finalPublications.push(publication);
    } catch (error) {
      console.error(`Error generating publication for ${content.ideaId}:`, error);
    }
  }
  
  return finalPublications;
}

/**
 * Genera una publicación final individual
 */
async function generateSinglePublication(
  content: DevelopedContent,
  campaignId: string,
  agencyId: string,
  userId: string
): Promise<FinalPublication> {
  
  const startTime = Date.now();
  let totalCost = 0;
  const aiProvidersUsed: string[] = [];
  const generatedAssets: string[] = [];

  // Para contenido solo texto
  if (content.contentType === 'text_only') {
    return {
      id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ideaId: content.ideaId,
      campaignId,
      platform: content.platform,
      contentType: 'text_only',
      scheduledDate: new Date(), // Se asignará desde la idea original
      content: {
        text: content.copy.mainText,
        hashtags: content.copy.hashtags
      },
      status: 'draft',
      generationMetrics: {
        totalCost: 0,
        generationTime: Date.now() - startTime,
        aiProvidersUsed: ['gemini'],
        assetsGenerated: 0
      }
    };
  }

  // Para contenido con imagen única
  if (content.contentType === 'single_image' && content.visualSpecs) {
    const designResult = await generateFinalDesign({
      templateId: content.visualSpecs.templateId!,
      content: {
        headline: content.copy.designText?.headline || '',
        subheadline: content.copy.designText?.subheadline,
        cta: content.copy.designText?.cta
      },
      assets: {
        brandColors: ['#007bff'] // Se obtendría del cliente
      },
      customizations: {
        backgroundPrompt: content.visualSpecs.imagePrompts?.[0],
        style: 'professional'
      }
    }, agencyId, userId);

    totalCost += designResult.metadata.totalCost;
    aiProvidersUsed.push('gemini', 'bananabanana');
    generatedAssets.push(designResult.finalImageUrl);

    return {
      id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ideaId: content.ideaId,
      campaignId,
      platform: content.platform,
      contentType: 'single_image',
      scheduledDate: new Date(),
      content: {
        text: content.copy.mainText,
        hashtags: content.copy.hashtags,
        images: [designResult.finalImageUrl],
        designAssets: [designResult.finalImageUrl]
      },
      status: 'draft',
      generationMetrics: {
        totalCost,
        generationTime: Date.now() - startTime,
        aiProvidersUsed,
        assetsGenerated: generatedAssets.length
      }
    };
  }

  // Para carrusel
  if (content.contentType === 'carousel' && content.visualSpecs?.carouselSlides) {
    const carouselImages: string[] = [];
    
    for (const slide of content.visualSpecs.carouselSlides) {
      const slideDesign = await generateFinalDesign({
        templateId: content.visualSpecs.templateId!,
        content: {
          headline: slide.content.split('\n')[0] || '',
          subheadline: slide.content.split('\n')[1],
        },
        assets: {
          brandColors: ['#007bff']
        },
        customizations: {
          backgroundPrompt: slide.imagePrompt,
          style: 'professional'
        }
      }, agencyId, userId);

      carouselImages.push(slideDesign.finalImageUrl);
      totalCost += slideDesign.metadata.totalCost;
    }

    aiProvidersUsed.push('gemini', 'bananabanana');

    return {
      id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ideaId: content.ideaId,
      campaignId,
      platform: content.platform,
      contentType: 'carousel',
      scheduledDate: new Date(),
      content: {
        text: content.copy.mainText,
        hashtags: content.copy.hashtags,
        images: carouselImages,
        designAssets: carouselImages
      },
      status: 'draft',
      generationMetrics: {
        totalCost,
        generationTime: Date.now() - startTime,
        aiProvidersUsed,
        assetsGenerated: carouselImages.length
      }
    };
  }

  throw new Error(`Unsupported content type: ${content.contentType}`);
}

/**
 * Funciones auxiliares
 */
function distributeContentDates(ideas: any[], dateRange: any, platforms: string[]): ContentIdea[] {
  const totalDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const postsPerDay = Math.ceil(ideas.length / totalDays);
  
  return ideas.map((idea, index) => {
    const dayOffset = Math.floor(index / postsPerDay);
    const scheduledDate = new Date(dateRange.startDate);
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
    
    return {
      id: `idea_${Date.now()}_${index}`,
      title: idea.title,
      concept: idea.concept,
      contentType: idea.contentType,
      platform: platforms[index % platforms.length],
      scheduledDate,
      topics: idea.topics || [],
      tone: idea.tone || 'professional',
      objective: idea.objective || 'engagement',
      priority: idea.priority || 'medium'
    };
  });
}

function calculateEstimatedCost(contentType: string): number {
  const costs = {
    text_only: 0.01,
    single_image: 0.08,
    carousel: 0.25,
    video: 0.50
  };
  return costs[contentType as keyof typeof costs] || 0.05;
}

/**
 * FUNCIÓN PRINCIPAL: Generar Campaña Completa
 */
export async function generateCompleteCampaign(
  request: CampaignContentRequest,
  agencyId: string,
  userId: string
): Promise<{
  ideas: ContentIdea[];
  developedContents: DevelopedContent[];
  finalPublications: FinalPublication[];
  summary: {
    totalPosts: number;
    totalCost: number;
    generationTime: number;
    contentMix: Record<string, number>;
  };
}> {
  
  const startTime = Date.now();
  
  try {
    // Paso 1: Generar ideas
    console.log('🎯 Generating campaign ideas...');
    const ideas = await generateCampaignIdeas(request, agencyId, userId);
    
    // Paso 2: Desarrollar contenido
    console.log('✍️ Developing content for each idea...');
    const developedContents = await developContentIdeas(ideas, request.campaignId, agencyId, userId);
    
    // Paso 3: Generar publicaciones finales
    console.log('🎨 Generating final publications...');
    const finalPublications = await generateFinalPublications(developedContents, request.campaignId, agencyId, userId);
    
    // Calcular resumen
    const totalCost = finalPublications.reduce((sum, pub) => sum + pub.generationMetrics.totalCost, 0);
    const contentMix = finalPublications.reduce((mix, pub) => {
      mix[pub.contentType] = (mix[pub.contentType] || 0) + 1;
      return mix;
    }, {} as Record<string, number>);
    
    const generationTime = Date.now() - startTime;
    
    console.log(`✅ Campaign generated: ${finalPublications.length} posts in ${generationTime}ms`);
    
    return {
      ideas,
      developedContents,
      finalPublications,
      summary: {
        totalPosts: finalPublications.length,
        totalCost,
        generationTime,
        contentMix
      }
    };
    
  } catch (error) {
    console.error('Error generating complete campaign:', error);
    throw new Error(`Failed to generate campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}