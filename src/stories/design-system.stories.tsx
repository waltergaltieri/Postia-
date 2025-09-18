import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Visión general del sistema de diseño de Postia con tokens, colores, tipografía y componentes base.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Paleta de colores
export const ColorPalette: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Paleta de Colores</h2>
        
        {/* Colores primarios */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Primarios</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary rounded-lg"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">--primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Primary Foreground</p>
              <p className="text-xs text-muted-foreground">--primary-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-secondary rounded-lg"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">--secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-secondary-foreground rounded-lg"></div>
              <p className="text-sm font-medium">Secondary Foreground</p>
              <p className="text-xs text-muted-foreground">--secondary-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-accent rounded-lg"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">--accent</p>
            </div>
          </div>
        </div>

        {/* Estados */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Estados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-destructive rounded-lg"></div>
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground">--destructive</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-green-500 rounded-lg"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-muted-foreground">Green 500</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-yellow-500 rounded-lg"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-muted-foreground">Yellow 500</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-blue-500 rounded-lg"></div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-muted-foreground">Blue 500</p>
            </div>
          </div>
        </div>

        {/* Neutros */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Neutros</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-background rounded-lg border"></div>
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-muted-foreground">--background</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-foreground rounded-lg"></div>
              <p className="text-sm font-medium">Foreground</p>
              <p className="text-xs text-muted-foreground">--foreground</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-muted rounded-lg"></div>
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground">--muted</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-muted-foreground rounded-lg"></div>
              <p className="text-sm font-medium">Muted Foreground</p>
              <p className="text-xs text-muted-foreground">--muted-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-border rounded-lg"></div>
              <p className="text-sm font-medium">Border</p>
              <p className="text-xs text-muted-foreground">--border</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-input rounded-lg"></div>
              <p className="text-sm font-medium">Input</p>
              <p className="text-xs text-muted-foreground">--input</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

// Tipografía
export const Typography: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Tipografía</h2>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold">Heading 1 - 36px Bold</h1>
            <p className="text-sm text-muted-foreground mt-1">text-4xl font-bold</p>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold">Heading 2 - 30px Bold</h2>
            <p className="text-sm text-muted-foreground mt-1">text-3xl font-bold</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold">Heading 3 - 24px Semibold</h3>
            <p className="text-sm text-muted-foreground mt-1">text-2xl font-semibold</p>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold">Heading 4 - 20px Semibold</h4>
            <p className="text-sm text-muted-foreground mt-1">text-xl font-semibold</p>
          </div>
          
          <div>
            <h5 className="text-lg font-medium">Heading 5 - 18px Medium</h5>
            <p className="text-sm text-muted-foreground mt-1">text-lg font-medium</p>
          </div>
          
          <div>
            <h6 className="text-base font-medium">Heading 6 - 16px Medium</h6>
            <p className="text-sm text-muted-foreground mt-1">text-base font-medium</p>
          </div>
          
          <div>
            <p className="text-base">Body Text - 16px Regular</p>
            <p className="text-sm text-muted-foreground mt-1">text-base</p>
          </div>
          
          <div>
            <p className="text-sm">Small Text - 14px Regular</p>
            <p className="text-sm text-muted-foreground mt-1">text-sm</p>
          </div>
          
          <div>
            <p className="text-xs">Extra Small - 12px Regular</p>
            <p className="text-sm text-muted-foreground mt-1">text-xs</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

// Espaciado
export const Spacing: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Sistema de Espaciado</h2>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((space) => (
            <div key={space} className="flex items-center gap-4">
              <div className="w-16 text-sm font-mono">{space}</div>
              <div 
                className="bg-primary h-4 rounded"
                style={{ width: `${space * 4}px` }}
              ></div>
              <div className="text-sm text-muted-foreground">{space * 4}px</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

// Componentes en acción
export const ComponentShowcase: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Componentes en Acción</h2>
        
        {/* Botones */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Botones</h3>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="premium">Premium</Button>
            <Button variant="gradient">Gradient</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Badges</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </div>

        {/* Cards */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content area.</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Info Card
                  <Badge variant="info">New</Badge>
                </CardTitle>
                <CardDescription>Card with accent border</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has a colored left border.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <CardTitle>Gradient Card</CardTitle>
                <CardDescription>Card with gradient background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has a subtle gradient background.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  ),
}