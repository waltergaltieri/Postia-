import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { ChevronRight, Download, Heart, Loader2, Plus } from 'lucide-react'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Botón premium con micro-interacciones y estados elegantes. Soporta múltiples variantes, tamaños y estados de carga.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'premium', 'gradient'],
      description: 'Variante visual del botón',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Tamaño del botón',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Variantes básicas
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Premium: Story = {
  args: {
    variant: 'premium',
    children: 'Premium Button',
  },
}

export const Gradient: Story = {
  args: {
    variant: 'gradient',
    children: 'Gradient Button',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

// Tamaños
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Plus className="h-4 w-4" />,
  },
}

// Estados
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </>
    ),
  },
}

// Con iconos
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download className="mr-2 h-4 w-4" />
        Download
      </>
    ),
  },
}

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        Continue
        <ChevronRight className="ml-2 h-4 w-4" />
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    size: 'icon',
    variant: 'outline',
    children: <Heart className="h-4 w-4" />,
  },
}

// Combinaciones premium
export const PremiumLarge: Story = {
  args: {
    variant: 'premium',
    size: 'lg',
    children: (
      <>
        <Plus className="mr-2 h-5 w-5" />
        Create Campaign
      </>
    ),
  },
}

export const GradientWithIcon: Story = {
  args: {
    variant: 'gradient',
    children: (
      <>
        Generate Content
        <ChevronRight className="ml-2 h-4 w-4" />
      </>
    ),
  },
}

// Showcase de todas las variantes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 p-4">
      <Button variant="default">Default</Button>
      <Button variant="premium">Premium</Button>
      <Button variant="gradient">Gradient</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas las variantes disponibles del componente Button.',
      },
    },
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todos los tamaños disponibles del componente Button.',
      },
    },
  },
}