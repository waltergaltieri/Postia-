import { db } from '@/lib/db';
import { generateWithGemini } from './gemini';
import { generateImage, generateImageComposition } from './bananabanana';

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'social_post' | 'story' | 'carousel' | 'banner' | 'ad';
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'universal';
  imageUrl: string; // URL de la plantilla base
  thumbnailUrl: string;
  description: string;
  requirements: {
    needsProductImage: boolean;
    needsBackgroundImage: boolean;
    needsLogo: boolean;
    textAreas: Array<{
      id: string;
      type: 'headline' | 'subheadline' | 'body' | 'cta' | 'caption';
      maxLength: number;
      position: { x: number; y: number; width: number; height: number };
      style: {
        fontSize: string;
        fontWeight: string;
        color: string;
        alignment: 'left' | 'center' | 'right';
      };
    }>;
  };
  metadata: {
    industry?: string[];
    style: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant';
    colorScheme: string[];
    difficulty: 'simple' | 'medium' | 'complex';
  };
}

export interface TemplateSelectionRequest {
  contentType: string;
  platform: string;
  brandStyle?: string;
  industry?: string;
  campaignObjective?: string;
  targetAudience?: string;
  brandColors?: string[];
}

export interface DesignGenerationRequest {
  templateId: string;
  content: {
    headline: string;
    subheadline?: string;
    body?: string;
    cta?: string;
  };
  assets: {
    productImages?: string[];
    logoUrl?: string;
    brandColors: string[];
  };
  customizations?: {
    backgroundPrompt?: string;
    productPrompt?: string;
    style?: string;
  };
}

/**
 * Selecciona la plantilla más adecuada usando IA
 */
export async function selectOptimalTemplate(
  request: TemplateSelectionRequest,
  agencyId: string,
  userId: string
): Promise<DesignTemplate> {
  // Obtener plantillas disponibles
  const availableTemplates = await getAvailableTemplates(request.platform, request.contentType);
  
  // Crear prompt para selección inteligente
  const selectionPrompt = `
  Eres un experto diseñador gráfico y director creativo. Selecciona la plantilla más adecuada para este proyecto:

  CONTEXTO DEL PROYECTO:
  - Tipo de contenido: ${request.contentType}
  - Plataforma: ${request.platform}
  - Industria: ${request.industry || 'general'}
  - Objetivo: ${request.campaignObjective || 'engagement'}
  - Audiencia: ${request.targetAudience || 'general'}
  - Estilo de marca: ${request.brandStyle || 'profesional'}
  - Colores de marca: ${request.brandColors?.join(', ') || 'no especificados'}

  PLANTILLAS DISPONIBLES:
  ${availableTemplates.map(t => `
  ID: ${t.id}
  Nombre: ${t.name}
  Descripción: ${t.description}
  Estilo: ${t.metadata.style}
  Industrias: ${t.metadata.industry?.join(', ') || 'universal'}
  Necesita imagen de producto: ${t.requirements.needsProductImage ? 'Sí' : 'No'}
  Necesita imagen de fondo: ${t.requirements.needsBackgroundImage ? 'Sí' : 'No'}
  Complejidad: ${t.metadata.difficulty}
  `).join('\n---\n')}

  INSTRUCCIONES:
  1. Analiza cada plantilla considerando el contexto del proyecto
  2. Evalúa la compatibilidad con la marca y objetivos
  3. Considera la complejidad vs. efectividad
  4. Selecciona la plantilla que mejor se adapte

  RESPUESTA:
  Devuelve SOLO el ID de la plantilla seleccionada y una breve justificación (máximo 50 palabras).
  Formato: "TEMPLATE_ID: justificación"
  `;

  try {
    const selectionResult = await generateWithGemini({
      prompt: selectionPrompt,
      model: 'gemini-pro',
      temperature: 0.3, // Más determinístico para selección
    }, agencyId, userId);

    // Extraer ID de la plantilla seleccionada
    const selectedId = selectionResult.content.split(':')[0].trim();
    const selectedTemplate = availableTemplates.find(t => t.id === selectedId);

    if (!selectedTemplate) {
      // Fallback: seleccionar la primera plantilla compatible
      return availableTemplates[0];
    }

    // Log de la selección para análisis
    console.log(`Template selected: ${selectedId} - ${selectionResult.content}`);

    return selectedTemplate;
  } catch (error) {
    console.error('Error in template selection:', error);
    // Fallback: seleccionar plantilla por defecto
    return availableTemplates[0];
  }
}

/**
 * Genera el diseño final usando la plantilla seleccionada
 */
export async function generateFinalDesign(
  request: DesignGenerationRequest,
  agencyId: string,
  userId: string
): Promise<{
  finalImageUrl: string;
  thumbnailUrl: string;
  template: DesignTemplate;
  generatedAssets: Array<{
    type: 'product' | 'background' | 'composition';
    imageUrl: string;
    prompt: string;
  }>;
  metadata: {
    generationTime: number;
    totalCost: number;
    stepsCompleted: string[];
  };
}> {
  const startTime = Date.now();
  const generatedAssets: any[] = [];
  let totalCost = 0;
  const stepsCompleted: string[] = [];

  try {
    // 1. Obtener plantilla
    const template = await getTemplateById(request.templateId);
    if (!template) {
      throw new Error(`Template ${request.templateId} not found`);
    }
    stepsCompleted.push('TEMPLATE_LOADED');

    // 2. Generar imagen de producto si es necesaria
    let productImageUrl = request.assets.productImages?.[0];
    if (template.requirements.needsProductImage && !productImageUrl) {
      const productPrompt = await generateProductImagePrompt(
        request.content,
        request.customizations?.productPrompt,
        template,
        agencyId,
        userId
      );

      const productImage = await generateImage({
        prompt: productPrompt,
        style: 'professional',
        aspectRatio: '1:1',
        quality: 'hd',
        brandColors: request.assets.brandColors,
      }, agencyId, userId);

      productImageUrl = productImage.imageUrl;
      totalCost += productImage.usage.cost;
      generatedAssets.push({
        type: 'product',
        imageUrl: productImageUrl,
        prompt: productPrompt
      });
      stepsCompleted.push('PRODUCT_IMAGE_GENERATED');
    }

    // 3. Generar imagen de fondo si es necesaria
    let backgroundImageUrl: string | undefined;
    if (template.requirements.needsBackgroundImage) {
      const backgroundPrompt = await generateBackgroundImagePrompt(
        request.content,
        request.customizations?.backgroundPrompt,
        template,
        agencyId,
        userId
      );

      const backgroundImage = await generateImage({
        prompt: backgroundPrompt,
        style: template.metadata.style === 'minimal' ? 'minimalist' : 'professional',
        aspectRatio: '16:9',
        quality: 'hd',
        brandColors: request.assets.brandColors,
      }, agencyId, userId);

      backgroundImageUrl = backgroundImage.imageUrl;
      totalCost += backgroundImage.usage.cost;
      generatedAssets.push({
        type: 'background',
        imageUrl: backgroundImageUrl,
        prompt: backgroundPrompt
      });
      stepsCompleted.push('BACKGROUND_IMAGE_GENERATED');
    }

    // 4. Crear composición final
    const compositionPrompt = await generateCompositionPrompt(
      template,
      request.content,
      request.assets,
      agencyId,
      userId
    );

    const finalComposition = await generateImageComposition({
      templateImageUrl: template.imageUrl,
      productImageUrl,
      backgroundImageUrl,
      logoUrl: request.assets.logoUrl,
      textContent: request.content,
      compositionPrompt,
      brandColors: request.assets.brandColors,
    }, agencyId, userId);

    totalCost += finalComposition.usage.cost;
    generatedAssets.push({
      type: 'composition',
      imageUrl: finalComposition.imageUrl,
      prompt: compositionPrompt
    });
    stepsCompleted.push('FINAL_COMPOSITION_GENERATED');

    const generationTime = Date.now() - startTime;

    return {
      finalImageUrl: finalComposition.imageUrl,
      thumbnailUrl: finalComposition.thumbnailUrl,
      template,
      generatedAssets,
      metadata: {
        generationTime,
        totalCost,
        stepsCompleted,
      },
    };

  } catch (error) {
    console.error('Error generating final design:', error);
    throw new Error(`Failed to generate design: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Genera prompt optimizado para imagen de producto
 */
async function generateProductImagePrompt(
  content: any,
  customPrompt: string | undefined,
  template: DesignTemplate,
  agencyId: string,
  userId: string
): Promise<string> {
  const promptGenerationRequest = `
  Crea un prompt optimizado para generar una imagen de producto que se usará en esta plantilla de diseño:

  CONTENIDO DEL DISEÑO:
  - Headline: "${content.headline}"
  - Descripción: "${content.body || content.subheadline || ''}"
  - CTA: "${content.cta || ''}"

  PLANTILLA:
  - Estilo: ${template.metadata.style}
  - Categoría: ${template.category}
  - Descripción: ${template.description}

  PROMPT PERSONALIZADO: ${customPrompt || 'Ninguno'}

  INSTRUCCIONES:
  1. El producto debe complementar el mensaje del headline
  2. Debe funcionar bien con el estilo de la plantilla
  3. Debe ser visualmente atractivo y profesional
  4. Enfócate en mostrar el producto en uso o contexto relevante
  5. Evita elementos que compitan con el texto de la plantilla

  Genera un prompt detallado y específico para la generación de imagen del producto.
  `;

  const result = await generateWithGemini({
    prompt: promptGenerationRequest,
    model: 'gemini-pro',
    temperature: 0.7,
  }, agencyId, userId);

  return result.content;
}

/**
 * Genera prompt optimizado para imagen de fondo
 */
async function generateBackgroundImagePrompt(
  content: any,
  customPrompt: string | undefined,
  template: DesignTemplate,
  agencyId: string,
  userId: string
): Promise<string> {
  const promptGenerationRequest = `
  Crea un prompt optimizado para generar una imagen de fondo que se usará en esta plantilla:

  CONTENIDO:
  - Mensaje principal: "${content.headline}"
  - Contexto: "${content.body || content.subheadline || ''}"

  PLANTILLA:
  - Estilo: ${template.metadata.style}
  - Colores: ${template.metadata.colorScheme.join(', ')}

  PROMPT PERSONALIZADO: ${customPrompt || 'Ninguno'}

  REQUISITOS:
  1. El fondo debe complementar, no competir con el texto
  2. Debe crear el ambiente/mood apropiado para el mensaje
  3. Debe funcionar como fondo (no muy detallado o distractivo)
  4. Debe ser coherente con el estilo de la plantilla
  5. Considera espacios para texto overlay

  Genera un prompt específico para la imagen de fondo.
  `;

  const result = await generateWithGemini({
    prompt: promptGenerationRequest,
    model: 'gemini-pro',
    temperature: 0.7,
  }, agencyId, userId);

  return result.content;
}

/**
 * Genera prompt para la composición final
 */
async function generateCompositionPrompt(
  template: DesignTemplate,
  content: any,
  assets: any,
  agencyId: string,
  userId: string
): Promise<string> {
  const compositionRequest = `
  Crea instrucciones detalladas para componer el diseño final:

  PLANTILLA BASE: ${template.name} - ${template.description}
  
  CONTENIDO DE TEXTO:
  ${Object.entries(content).map(([key, value]) => `- ${key}: "${value}"`).join('\n')}

  ELEMENTOS DISPONIBLES:
  - Plantilla: ${template.imageUrl}
  - Logo: ${assets.logoUrl ? 'Disponible' : 'No disponible'}
  - Colores de marca: ${assets.brandColors.join(', ')}

  ÁREAS DE TEXTO DEFINIDAS:
  ${template.requirements.textAreas.map(area => `
  - ${area.type}: Posición (${area.position.x}, ${area.position.y}), Tamaño ${area.style.fontSize}, Color ${area.style.color}
  `).join('')}

  INSTRUCCIONES:
  Crea un prompt detallado para BananaBanana que incluya:
  1. Cómo integrar todos los elementos
  2. Posicionamiento exacto de textos
  3. Jerarquía visual
  4. Coherencia de colores y estilo
  5. Optimización para la plataforma objetivo

  El resultado debe ser un diseño cohesivo y profesional.
  `;

  const result = await generateWithGemini({
    prompt: compositionRequest,
    model: 'gemini-pro',
    temperature: 0.5,
  }, agencyId, userId);

  return result.content;
}

/**
 * Obtiene plantillas disponibles filtradas
 */
async function getAvailableTemplates(
  platform: string,
  contentType: string
): Promise<DesignTemplate[]> {
  // En una implementación real, esto vendría de la base de datos
  // Por ahora, devolvemos plantillas simuladas
  return [
    {
      id: 'modern_product_showcase',
      name: 'Modern Product Showcase',
      category: 'social_post' as const,
      platform: 'universal' as const,
      imageUrl: 'https://templates.postia.com/modern_product_showcase.png',
      thumbnailUrl: 'https://templates.postia.com/thumbs/modern_product_showcase.jpg',
      description: 'Plantilla moderna para destacar productos con texto overlay elegante',
      requirements: {
        needsProductImage: true,
        needsBackgroundImage: false,
        needsLogo: true,
        textAreas: [
          {
            id: 'headline',
            type: 'headline',
            maxLength: 30,
            position: { x: 50, y: 100, width: 300, height: 60 },
            style: { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', alignment: 'center' }
          },
          {
            id: 'cta',
            type: 'cta',
            maxLength: 15,
            position: { x: 50, y: 300, width: 200, height: 40 },
            style: { fontSize: '16px', fontWeight: 'medium', color: '#007bff', alignment: 'center' }
          }
        ]
      },
      metadata: {
        industry: ['tech', 'retail', 'services'],
        style: 'modern',
        colorScheme: ['#ffffff', '#007bff', '#28a745'],
        difficulty: 'medium'
      }
    },
    // Más plantillas...
  ];
}

/**
 * Obtiene plantilla por ID
 */
async function getTemplateById(templateId: string): Promise<DesignTemplate | null> {
  const templates = await getAvailableTemplates('universal', 'social_post');
  return templates.find(t => t.id === templateId) || null;
}