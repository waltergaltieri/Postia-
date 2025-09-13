# Flujo de Creación de Diseño - Postia SaaS

## Descripción General

El sistema de creación de diseño de Postia SaaS utiliza un workflow de 5 pasos que combina múltiples servicios de IA para crear contenido visual completo y optimizado.

## Arquitectura del Workflow

```
Usuario → Job Queue → Paso 1 (IDEA) → Paso 2 (COPY_DESIGN) → Paso 3 (COPY_PUBLICATION) → Paso 4 (BASE_IMAGE) → Paso 5 (FINAL_DESIGN) → Resultado Final
```

## Flujo Detallado

### 1. Iniciación del Proceso

```typescript
// API Call: POST /api/content/generate
const jobRequest = {
  campaignId: "campaign-123",
  clientId: "client-456", 
  steps: ["IDEA", "COPY_DESIGN", "COPY_PUBLICATION", "BASE_IMAGE", "FINAL_DESIGN"],
  options: {
    platforms: ["instagram", "facebook", "twitter"],
    brandTone: "professional",
    targetAudience: "B2B professionals"
  }
}
```

### 2. Procesamiento Asíncrono

El sistema crea un **Job** que procesa cada paso secuencialmente:

```typescript
// Job Creation
const job = await createContentGenerationJob({
  agencyId: "agency-789",
  userId: "user-101",
  type: "FULL_DESIGN_WORKFLOW",
  data: jobRequest,
  priority: "HIGH"
});
```

### 3. Ejecución de Pasos

#### Paso 1: IDEA Generation 💡

**Servicio**: OpenAI GPT-4
**Función**: Generar concepto creativo

```typescript
const ideaPrompt = `
Contexto de Marca: ${client.brandGuidelines}
Objetivo de Campaña: ${campaign.objective}
Audiencia: ${campaign.targetAudience}
Tono: ${campaign.brandTone}

Genera 3 conceptos creativos para contenido visual que:
1. Conecte emocionalmente con la audiencia
2. Refleje los valores de la marca
3. Sea visualmente impactante
4. Funcione en redes sociales

Para cada concepto incluye:
- Idea principal
- Elementos visuales clave
- Mensaje emocional
- Ángulo diferenciador
`;

const ideaResult = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: ideaPrompt }],
  temperature: 0.8 // Más creatividad
});
```

#### Paso 2: COPY_DESIGN ✍️

**Servicio**: OpenAI GPT-4 o Gemini Pro
**Función**: Crear textos para el diseño

```typescript
const copyPrompt = `
Concepto Seleccionado: ${previousSteps.IDEA.selectedConcept}
Brand Voice: ${client.brandVoice}
Plataformas: ${platforms.join(", ")}

Crea copy optimizado para diseño visual:
1. Headline principal (máx 6 palabras)
2. Subheadline explicativo (máx 12 palabras)  
3. Call-to-action (máx 3 palabras)
4. Texto de apoyo (máx 20 palabras)

El copy debe:
- Ser impactante visualmente
- Funcionar con overlay de texto
- Mantener consistencia de marca
- Optimizar para engagement
`;

const copyResult = await generateAIContent({
  prompt: copyPrompt,
  aiProvider: "openai", // o "gemini"
  model: "gpt-4"
});
```

#### Paso 3: COPY_PUBLICATION 📱

**Servicio**: Gemini Pro (optimizado para redes sociales)
**Función**: Adaptar copy para cada plataforma

```typescript
const platforms = ["instagram", "facebook", "twitter", "linkedin"];
const publicationCopy = {};

for (const platform of platforms) {
  const platformPrompt = `
  Copy Base: ${previousSteps.COPY_DESIGN}
  Plataforma: ${platform}
  Límites: ${getPlatformLimits(platform)}
  
  Adapta el copy para ${platform}:
  - Respeta límites de caracteres
  - Usa hashtags apropiados
  - Optimiza para algoritmo de ${platform}
  - Mantén el mensaje core
  `;
  
  publicationCopy[platform] = await generateWithGemini({
    prompt: platformPrompt,
    model: "gemini-pro",
    temperature: 0.7
  });
}
```

#### Paso 4: BASE_IMAGE 🖼️

**Servicio**: BananaBanana + Gemini
**Función**: Generar imagen base optimizada

```typescript
// Construir prompt de imagen basado en pasos anteriores
const imagePrompt = `
Concepto: ${previousSteps.IDEA.concept}
Elementos Visuales: ${previousSteps.IDEA.visualElements}
Mensaje: ${previousSteps.COPY_DESIGN.headline}
Brand Colors: ${client.brandColors}
Style Guidelines: ${client.visualGuidelines}

Crear imagen que:
- Soporte overlay de texto
- Refleje el concepto creativo
- Use colores de marca
- Sea visualmente impactante
- Funcione en múltiples formatos
`;

const imageResult = await generateImage({
  prompt: imagePrompt,
  style: client.preferredStyle || "professional",
  aspectRatio: "16:9", // Base ratio, se adaptará después
  quality: "hd",
  brandColors: client.brandColors,
  excludeElements: client.excludeElements || []
}, agencyId, userId, job.id);
```

#### Paso 5: FINAL_DESIGN 🎨

**Servicio**: OpenAI GPT-4 (para especificaciones técnicas)
**Función**: Crear especificaciones de diseño final

```typescript
const designPrompt = `
Elementos Disponibles:
- Imagen Base: ${previousSteps.BASE_IMAGE.imageUrl}
- Headline: "${previousSteps.COPY_DESIGN.headline}"
- Subheadline: "${previousSteps.COPY_DESIGN.subheadline}"
- CTA: "${previousSteps.COPY_DESIGN.cta}"
- Copy por Plataforma: ${JSON.stringify(previousSteps.COPY_PUBLICATION)}

Crear especificaciones de diseño final para cada plataforma:

Para cada formato (Instagram 1:1, Facebook 16:9, Twitter 16:9, LinkedIn 1.91:1):
1. Layout y composición
2. Posicionamiento de textos
3. Jerarquía visual
4. Elementos de marca (logo, colores)
5. Adaptaciones específicas por plataforma

Formato de salida: JSON con especificaciones técnicas detalladas.
`;

const designSpecs = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: designPrompt }],
  temperature: 0.3 // Más precisión técnica
});
```

### 4. Resultado Final

```typescript
const finalResult = {
  jobId: job.id,
  status: "COMPLETED",
  steps: {
    IDEA: {
      concepts: [...],
      selectedConcept: {...},
      tokensUsed: 450
    },
    COPY_DESIGN: {
      headline: "Transforma tu productividad",
      subheadline: "La herramienta que necesitas",
      cta: "Descubre cómo",
      supportingText: "...",
      tokensUsed: 320
    },
    COPY_PUBLICATION: {
      instagram: "...",
      facebook: "...", 
      twitter: "...",
      linkedin: "...",
      tokensUsed: 280
    },
    BASE_IMAGE: {
      imageUrl: "https://images.bananabanana.com/...",
      thumbnailUrl: "https://images.bananabanana.com/...",
      optimizedPrompt: "...",
      cost: 0.04,
      generationTime: 2500
    },
    FINAL_DESIGN: {
      specifications: {
        instagram: {
          dimensions: "1080x1080",
          layout: {...},
          textPositions: {...}
        },
        facebook: {...},
        twitter: {...},
        linkedin: {...}
      },
      tokensUsed: 180
    }
  },
  totalCost: 0.12,
  totalTokens: 1230,
  generationTime: 8500,
  createdAssets: [
    {
      platform: "instagram",
      imageUrl: "...",
      copy: "...",
      specifications: {...}
    }
    // ... más plataformas
  ]
}
```

## Monitoreo y Tracking

### Métricas por Paso
- Tiempo de ejecución
- Tokens consumidos  
- Costo por paso
- Tasa de éxito/error
- Calidad del output (scoring)

### Logs Estructurados
```json
{
  "jobId": "job-123",
  "step": "BASE_IMAGE", 
  "service": "BananaBanana",
  "agencyId": "agency-789",
  "userId": "user-101",
  "executionTime": 2500,
  "tokensUsed": 0,
  "cost": 0.04,
  "success": true,
  "metadata": {
    "imageQuality": "hd",
    "promptOptimization": true,
    "brandCompliance": true
  }
}
```

## Optimizaciones

### Cache Inteligente
- Reutilización de conceptos similares
- Cache de imágenes por estilo/marca
- Optimización de prompts recurrentes

### Paralelización
- Pasos 2 y 3 pueden ejecutarse en paralelo
- Generación simultánea para múltiples plataformas
- Batch processing para campañas grandes

### Quality Assurance
- Validación automática de brand compliance
- Scoring de calidad por IA
- A/B testing de diferentes enfoques

## API Endpoints

### Iniciar Workflow
```
POST /api/content/generate
```

### Monitorear Progreso  
```
GET /api/content/jobs/{jobId}
```

### Obtener Resultado
```
GET /api/content/jobs/{jobId}/result
```

### Regenerar Paso Específico
```
POST /api/content/jobs/{jobId}/regenerate
Body: { step: "BASE_IMAGE", options: {...} }
```

## Casos de Uso

### 1. Campaña Completa
- Genera 20+ diseños para una campaña
- Múltiples variaciones por concepto
- Adaptación automática a todas las plataformas

### 2. Contenido Rápido
- Solo pasos COPY_PUBLICATION + BASE_IMAGE
- Para contenido urgente o reactivo
- Tiempo de generación < 30 segundos

### 3. Optimización de Existente
- Solo paso FINAL_DESIGN
- Mejora diseños existentes
- A/B testing de layouts

## Conclusión

Este workflow de 5 pasos proporciona un sistema completo y escalable para la creación automatizada de contenido visual de alta calidad, combinando las mejores capacidades de IA para texto e imágenes en un proceso optimizado y monitoreado.