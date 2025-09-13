'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [config, setConfig] = useState({
    contentCount: 10,
    platforms: ['instagram', 'facebook', 'twitter'],
    contentMix: {
      textOnly: 30,
      singleImage: 50,
      carousel: 15,
      video: 5
    }
  });

  const generateCampaign = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Starting real campaign generation...');
      
      const response = await fetch('/api/demo/generate-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentCount: config.contentCount,
          platforms: config.platforms,
          contentMix: config.contentMix
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Campaign generated successfully!');
        setResult(data);
      } else {
        throw new Error(data.error || 'Failed to generate campaign');
      }
    } catch (error) {
      console.error('❌ Campaign generation failed:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🚀 Postia SaaS - Demo</h1>
        <p className="text-xl text-gray-600">
          Generación Masiva de Contenido para Campañas
        </p>
      </div>

      {!result ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Configuración de Campaña</CardTitle>
            <CardDescription>
              Configura los parámetros para generar contenido masivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de Posts
              </label>
              <Input
                type="number"
                value={config.contentCount}
                onChange={(e) => setConfig({
                  ...config,
                  contentCount: parseInt(e.target.value) || 10
                })}
                min="5"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Plataformas
              </label>
              <div className="flex flex-wrap gap-2">
                {['instagram', 'facebook', 'twitter', 'linkedin'].map(platform => (
                  <label key={platform} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            platforms: [...config.platforms, platform]
                          });
                        } else {
                          setConfig({
                            ...config,
                            platforms: config.platforms.filter(p => p !== platform)
                          });
                        }
                      }}
                    />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">
                Mix de Contenido (%)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Solo Texto</label>
                  <Input
                    type="number"
                    value={config.contentMix.textOnly}
                    onChange={(e) => setConfig({
                      ...config,
                      contentMix: {
                        ...config.contentMix,
                        textOnly: parseInt(e.target.value) || 0
                      }
                    })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Imagen Única</label>
                  <Input
                    type="number"
                    value={config.contentMix.singleImage}
                    onChange={(e) => setConfig({
                      ...config,
                      contentMix: {
                        ...config.contentMix,
                        singleImage: parseInt(e.target.value) || 0
                      }
                    })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Carrusel</label>
                  <Input
                    type="number"
                    value={config.contentMix.carousel}
                    onChange={(e) => setConfig({
                      ...config,
                      contentMix: {
                        ...config.contentMix,
                        carousel: parseInt(e.target.value) || 0
                      }
                    })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Video</label>
                  <Input
                    type="number"
                    value={config.contentMix.video}
                    onChange={(e) => setConfig({
                      ...config,
                      contentMix: {
                        ...config.contentMix,
                        video: parseInt(e.target.value) || 0
                      }
                    })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Estimación:</h4>
              <div className="text-sm space-y-1">
                <p>📊 Posts totales: <strong>{config.contentCount}</strong></p>
                <p>💰 Costo estimado: <strong>${(config.contentCount * 0.08).toFixed(2)}</strong></p>
                <p>⏱️ Tiempo estimado: <strong>~{Math.ceil(config.contentCount / 4)} minutos</strong></p>
              </div>
            </div>

            <Button 
              onClick={generateCampaign}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando Campaña...
                </>
              ) : (
                '🚀 Generar Campaña Completa'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Campaña Generada Exitosamente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.data.summary.totalPosts}</div>
                  <div className="text-sm text-gray-600">Posts Generados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${result.data.summary.totalCost}</div>
                  <div className="text-sm text-gray-600">Costo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.floor(result.data.summary.generationTime / 1000)}s</div>
                  <div className="text-sm text-gray-600">Tiempo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-gray-600">Éxito</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mix de Contenido */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Distribución de Contenido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold">{result.data.summary.contentMix.text_only}</div>
                  <div className="text-sm">Solo Texto</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold">{result.data.summary.contentMix.single_image}</div>
                  <div className="text-sm">Con Imagen</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold">{result.data.summary.contentMix.carousel}</div>
                  <div className="text-sm">Carrusel</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold">{result.data.summary.contentMix.video}</div>
                  <div className="text-sm">Video</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Posts */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Posts Generados</CardTitle>
              <CardDescription>
                Vista previa de los primeros posts generados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {result.data.publications.slice(0, 10).map((post: any, index: number) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium bg-blue-100 px-2 py-1 rounded">
                          {post.platform}
                        </span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {post.contentType.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(post.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{post.content.text}</p>
                    
                    {post.content.images && (
                      <div className="mb-2">
                        <img 
                          src={post.content.images[0]} 
                          alt="Generated content"
                          className="w-20 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {post.content.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={() => setResult(null)} variant="outline">
              🔄 Generar Nueva Campaña
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}