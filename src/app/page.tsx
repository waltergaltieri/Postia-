import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Postia SaaS
          </h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma de IA más avanzada para generar contenido masivo de marketing. 
            Escala tu agencia sin límites.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-4">
                🚀 Access Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              📖 Ver Documentación
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🤖</span>
                <span>IA Avanzada</span>
              </CardTitle>
              <CardDescription>
                Combina OpenAI GPT-4 + Google Gemini + BananaBanana para crear contenido profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Generación de ideas estratégicas</li>
                <li>✅ Copy optimizado por plataforma</li>
                <li>✅ Diseños visuales automáticos</li>
                <li>✅ Composición de imágenes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Escalabilidad</span>
              </CardTitle>
              <CardDescription>
                De 5 a 500 clientes sin contratar más personal creativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ 20+ posts en 45 minutos</li>
                <li>✅ Múltiples plataformas simultáneas</li>
                <li>✅ Calendario automático</li>
                <li>✅ Brand compliance garantizado</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>💰</span>
                <span>ROI Increíble</span>
              </CardTitle>
              <CardDescription>
                80% menos costo que métodos tradicionales con mejor calidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ $0.08 por post vs $200 manual</li>
                <li>✅ 95% más rápido</li>
                <li>✅ Consistencia profesional</li>
                <li>✅ Márgenes de 90%+</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">🎯 El Problema que Resolvemos</CardTitle>
            </CardHeader>
            <CardContent className="text-left">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold mb-4 text-red-600">❌ Agencia Tradicional</h4>
                  <ul className="space-y-2">
                    <li>• 1 diseñador = máximo 5-8 clientes</li>
                    <li>• $200-400 por post de calidad</li>
                    <li>• 2-5 días por entrega</li>
                    <li>• Inconsistencia de calidad</li>
                    <li>• Imposible escalar sin contratar</li>
                    <li>• Márgenes del 40-60%</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-4 text-green-600">✅ Con Postia SaaS</h4>
                  <ul className="space-y-2">
                    <li>• 1 manager = 100+ clientes</li>
                    <li>• $0.08 por post profesional</li>
                    <li>• 45 minutos para 20 posts</li>
                    <li>• Calidad consistente garantizada</li>
                    <li>• Escalabilidad ilimitada</li>
                    <li>• Márgenes del 80-90%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}