"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ContentCard } from "@/components/ui/content-card"
import { 
  Download, 
  Heart, 
  Star, 
  Zap, 
  Sparkles,
  Eye,
  Edit3,
  Copy,
  Share2,
  Trash2
} from "lucide-react"

export function PremiumComponentsDemo() {
  const [selectedCards, setSelectedCards] = React.useState<Set<string>>(new Set())

  const handleCardSelect = (cardId: string, selected: boolean) => {
    const newSelected = new Set(selectedCards)
    if (selected) {
      newSelected.add(cardId)
    } else {
      newSelected.delete(cardId)
    }
    setSelectedCards(newSelected)
  }

  const contentCards = [
    {
      id: "1",
      title: "Post promocional de verano",
      description: "Campaña para promocionar productos de temporada con colores vibrantes",
      status: "approved" as const,
      contentType: "image" as const,
      platform: "Instagram",
      createdAt: new Date("2024-01-15"),
      scheduledAt: new Date("2024-01-20")
    },
    {
      id: "2", 
      title: "Video tutorial de producto",
      description: "Explicación paso a paso de cómo usar nuestro producto principal",
      status: "pending" as const,
      contentType: "video" as const,
      platform: "YouTube",
      createdAt: new Date("2024-01-14")
    },
    {
      id: "3",
      title: "Carrusel de testimonios",
      description: "Recopilación de reseñas positivas de clientes satisfechos",
      status: "published" as const,
      contentType: "carousel" as const,
      platform: "LinkedIn",
      createdAt: new Date("2024-01-10"),
      scheduledAt: new Date("2024-01-12")
    },
    {
      id: "4",
      title: "Artículo de blog",
      description: "Guía completa sobre las mejores prácticas en marketing digital",
      status: "draft" as const,
      contentType: "text" as const,
      platform: "Blog",
      createdAt: new Date("2024-01-16")
    }
  ]

  return (
    <div className="p-8 space-y-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient-primary mb-4">
            Componentes Premium UI/UX
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Demostración de los nuevos componentes rediseñados con estética premium, 
            micro-interacciones y efectos visuales elegantes.
          </p>
        </div>

        {/* Button Variants Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Botones Premium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Primary Buttons */}
            <Card variant="elevated" className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Botones Primarios</CardTitle>
                <CardDescription>Con gradientes y efectos de brillo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="default" icon={<Zap /> <span>}>
                  Generar Contenido</span></Button>
                <Button variant="premium" icon={<Sparkles /> <span>}>
                  Premium Action</span></Button>
                <Button variant="default" loading loadingText="Generando..."> <span>Loading State</span></Button>
              </CardContent>
            </Card>

            {/* Secondary Buttons */}
            <Card variant="elevated" className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Botones Secundarios</CardTitle>
                <CardDescription>Variantes sutiles y elegantes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="secondary" icon={<Download /> <span>}>
                  Descargar</span></Button>
                <Button variant="outline" rightIcon={<Heart /> <span>}>
                  Me Gusta</span></Button>
                <Button variant="ghost" size="sm"> <span>Cancelar</span></Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card variant="elevated" className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Botones de Acción</CardTitle>
                <CardDescription>Estados y variantes especiales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="success" icon={<Star /> <span>}>
                  Aprobar</span></Button>
                <Button variant="destructive" size="lg"> <span>Eliminar</span></Button>
                <Button variant="link"> <span>Ver más detalles</span></Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card Variants Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Tarjetas con Elevación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Card variant="default" interactive>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Elevación sutil con hover</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tarjeta básica con efectos de hover elegantes.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" interactive>
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Mayor elevación</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tarjeta con sombra más prominente.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" interactive>
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Efecto glassmorphism</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tarjeta con efecto de cristal y blur.
                </p>
              </CardContent>
            </Card>

            <Card variant="premium" interactive>
              <CardHeader>
                <CardTitle>Premium Card</CardTitle>
                <CardDescription>Borde con gradiente</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tarjeta premium con borde gradiente.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Content Cards Demo */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Tarjetas de Contenido</h2>
              <p className="text-muted-foreground">
                Especializadas para mostrar contenido generado con overlays y acciones
              </p>
            </div>
            {selectedCards.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedCards.size} seleccionadas
                </span>
                <Button variant="secondary" size="sm"> <span>Acciones en lote</span></Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contentCards.map((card) => (
              <ContentCard
                key={card.id}
                title={card.title}
                description={card.description}
                status={card.status}
                contentType={card.contentType}
                platform={card.platform}
                createdAt={card.createdAt}
                scheduledAt={card.scheduledAt}
                selected={selectedCards.has(card.id)}
                onSelect={(selected) => handleCardSelect(card.id, selected)}
                onView={() => console.log(`Viewing ${card.title}`)}
                onEdit={() => console.log(`Editing ${card.title}`)}
                actions={[
                  { icon: Eye, label: "Ver", onClick: () => console.log("Ver") },
                  { icon: Edit3, label: "Editar", onClick: () => console.log("Editar") },
                  { icon: Copy, label: "Duplicar", onClick: () => console.log("Duplicar") },
                  { icon: Share2, label: "Compartir", onClick: () => console.log("Compartir") },
                  { icon: Trash2, label: "Eliminar", onClick: () => console.log("Eliminar"), variant: "destructive" }
                ]}
              />
            ))}
          </div>
        </section>

        {/* Interactive Demo */}
        <section>
          <Card variant="premium" className="p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gradient-primary">
                Experiencia Interactiva
              </CardTitle>
              <CardDescription className="text-lg">
                Todos los componentes incluyen micro-interacciones y feedback visual
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="premium" size="lg" icon={<Sparkles /> <span>}>
                  Crear Campaña Premium</span></Button>
                <Button variant="default" size="lg" rightIcon={<Zap /> <span>}>
                  Generar con IA</span></Button>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Cada interacción está cuidadosamente diseñada para proporcionar feedback 
                inmediato y crear una experiencia fluida y profesional que inspire confianza.
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline"> <span>Explorar más componentes</span></Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  )
}