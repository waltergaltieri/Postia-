import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Badge para mostrar estados, categorías y etiquetas de manera visual y compacta.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
      description: 'Variante visual del badge',
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
}

// Estados de contenido
export const ContentStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="warning">Pending Review</Badge>
      <Badge variant="info">In Progress</Badge>
      <Badge variant="success">Published</Badge>
      <Badge variant="destructive">Rejected</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges utilizados para mostrar estados de contenido en la aplicación.',
      },
    },
  },
}

// Categorías de campaña
export const CampaignCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Social Media</Badge>
      <Badge variant="secondary">Email Marketing</Badge>
      <Badge variant="outline">Blog Content</Badge>
      <Badge variant="info">Video Content</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges para categorizar diferentes tipos de campañas.',
      },
    },
  },
}

// Prioridades
export const Priorities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">High Priority</Badge>
      <Badge variant="warning">Medium Priority</Badge>
      <Badge variant="secondary">Low Priority</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges para indicar niveles de prioridad.',
      },
    },
  },
}

// Todas las variantes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas las variantes disponibles del componente Badge.',
      },
    },
  },
}