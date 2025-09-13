# BananaBanana + Gemini Integration

## Descripción

BananaBanana es el servicio de generación de imágenes de Postia SaaS que utiliza la API de Google Gemini para crear y optimizar imágenes de alta calidad.

## Arquitectura

```
Cliente → BananaBanana Service → Gemini API → Resultado Optimizado
```

### Flujo de Generación de Imágenes

1. **Recepción de Solicitud**: El cliente envía una solicitud con prompt, estilo, calidad, etc.
2. **Optimización con Gemini**: Gemini Pro analiza y optimiza el prompt para mejor generación
3. **Generación de Descripción**: Se crea una descripción técnica detallada
4. **Simulación de Imagen**: Se genera una URL simulada (en producción sería una imagen real)
5. **Tracking de Uso**: Se registra el consumo de tokens y costos

### Funcionalidades Implementadas

#### 1. Generación de Imágenes
```typescript
const result = await generateImage({
  prompt: "A professional business meeting",
  style: "professional",
  aspectRatio: "16:9",
  quality: "hd",
  brandColors: ["#007bff", "#28a745"],
  excludeElements: ["casual clothing"]
}, agencyId, userId);
```

#### 2. Upscaling Inteligente
```typescript
const upscaled = await upscaleImage(
  "https://example.com/image.jpg",
  "ultra",
  agencyId,
  userId
);
```

#### 3. Variaciones de Imagen
```typescript
const variations = await generateImageVariations({
  prompt: "Corporate headshots",
  style: "professional"
}, 3, agencyId, userId);
```

## Integración con Gemini

### Optimización de Prompts

BananaBanana usa Gemini Pro para:

- **Análisis de Contexto**: Entiende el contexto del negocio y marca
- **Optimización Técnica**: Mejora los prompts para mejor calidad
- **Especificaciones Visuales**: Añade detalles técnicos de composición
- **Coherencia de Marca**: Asegura consistencia con guidelines

### Ejemplo de Optimización

**Prompt Original:**
```
"Create a social media post image for a tech company"
```

**Prompt Optimizado por Gemini:**
```
"Create a professional image: Create a social media post image for a tech company. 
Style: professional, clean, business-appropriate, high quality. 
Format: square format, centered composition. 
Quality: high definition, crisp details, professional quality. 
Technical focus with modern design elements, clean typography space, 
corporate color scheme, minimalist composition with technology elements."
```

## Configuración

### Variables de Entorno

```env
# Gemini API Key (usado por BananaBanana)
GEMINI_API_KEY="tu-gemini-api-key"
```

### Precios

```typescript
const BANANABANANA_PRICING = {
  standard: 0.02, // $0.02 por imagen
  hd: 0.04,       // $0.04 por imagen  
  ultra: 0.08,    // $0.08 por imagen
};
```

## Uso en el Frontend

### Selector de Calidad
```tsx
<Select value={quality} onValueChange={setQuality}>
  <SelectItem value="standard">Standard ($0.02)</SelectItem>
  <SelectItem value="hd">HD ($0.04)</SelectItem>
  <SelectItem value="ultra">Ultra HD ($0.08)</SelectItem>
</Select>
```

### Generación con Progreso
```tsx
const [generating, setGenerating] = useState(false);

const handleGenerate = async () => {
  setGenerating(true);
  try {
    const result = await fetch('/api/images/generate', {
      method: 'POST',
      body: JSON.stringify(imageRequest)
    });
    // Manejar resultado
  } finally {
    setGenerating(false);
  }
};
```

## API Endpoints

### POST /api/images/generate
Genera una nueva imagen usando BananaBanana + Gemini

### POST /api/images/upscale
Mejora la calidad de una imagen existente

### POST /api/images/variations
Crea múltiples variaciones de una imagen

### GET /api/images/health
Verifica el estado del servicio BananaBanana

## Monitoreo y Logs

### Métricas Tracked
- Tiempo de generación
- Tokens consumidos
- Costo por operación
- Tasa de éxito/error
- Uso por agencia/usuario

### Logs Estructurados
```json
{
  "service": "BananaBanana",
  "operation": "IMAGE_GENERATION",
  "agencyId": "agency-123",
  "userId": "user-456",
  "cost": 0.04,
  "generationTime": 2500,
  "quality": "hd",
  "success": true
}
```

## Limitaciones Actuales

1. **Simulación**: Actualmente genera URLs simuladas (no imágenes reales)
2. **Gemini Limits**: Sujeto a límites de cuota de Gemini API
3. **Filtros de Seguridad**: Contenido puede ser bloqueado por filtros de Gemini

## Roadmap

### Próximas Funcionalidades
- [ ] Integración con API real de generación de imágenes
- [ ] Análisis de imágenes existentes con Gemini Vision
- [ ] Optimización automática de prompts por industria
- [ ] Cache inteligente de imágenes generadas
- [ ] Batch processing para múltiples imágenes

### Mejoras Técnicas
- [ ] Retry logic para fallos de API
- [ ] Compresión automática de imágenes
- [ ] CDN integration para delivery optimizado
- [ ] A/B testing de diferentes prompts

## Troubleshooting

### Errores Comunes

**"Gemini API quota exceeded"**
- Verificar límites de cuota en Google Cloud Console
- Implementar rate limiting en el cliente

**"Content blocked by safety filters"**
- Revisar y ajustar el prompt
- Evitar contenido sensible o inapropiado

**"Failed to generate image"**
- Verificar conectividad a Gemini API
- Revisar logs para detalles específicos

### Health Checks
```bash
# Verificar estado del servicio
curl http://localhost:3000/api/images/health

# Verificar configuración
npm run db:health-check
```

## Conclusión

BananaBanana + Gemini proporciona una solución robusta para generación de imágenes optimizada por IA, aprovechando las capacidades avanzadas de análisis y optimización de Google Gemini para crear contenido visual de alta calidad adaptado a las necesidades específicas de cada marca y campaña.