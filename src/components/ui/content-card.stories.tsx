import type { Meta, StoryObj } from '@storybook/react'
import { ContentCard } from './content-card'

const meta = {
  title: 'UI/ContentCard',
  component: ContentCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ContentCard especializado para mostrar contenido generado por IA con overlay de acciones y indicadores de estado elegantes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['draft', 'pending', 'approved', 'published', 'rejected'],
      description: 'Estado del contenido',
    },
    type: {
      control: { type: 'select' },
      options: ['instagram', 'facebook', 'twitter', 'linkedin', 'blog', 'email'],
      description: 'Tipo de contenido',
    },
  },
} satisfies Meta<typeof ContentCard>

export default meta
type Story = StoryObj<typeof meta>

// Contenido de Instagram
export const InstagramPost: Story = {
  args: {
    id: '1',
    title: 'Summer Vibes Collection',
    description: 'Discover the perfect summer vibes with our latest collection. Embrace the warmth and style that defines your unique personality this season.',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
    type: 'instagram',
    status: 'draft',
    campaign: 'Summer 2024',
    createdAt: new Date('2024-01-15T10:30:00'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onPublish: () => console.log('Publish clicked'),
    onDuplicate: () => console.log('Duplicate clicked'),
  },
}

// Contenido aprobado
export const ApprovedContent: Story = {
  args: {
    id: '2',
    title: 'Product Launch Announcement',
    description: 'We are excited to announce the launch of our revolutionary new product that will change the way you think about innovation.',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
    type: 'linkedin',
    status: 'approved',
    campaign: 'Product Launch Q1',
    createdAt: new Date('2024-01-14T14:20:00'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onPublish: () => console.log('Publish clicked'),
    onDuplicate: () => console.log('Duplicate clicked'),
  },
}

// Contenido publicado
export const PublishedContent: Story = {
  args: {
    id: '3',
    title: 'Behind the Scenes',
    description: 'Take a look behind the scenes of our creative process and see how we bring ideas to life.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop',
    type: 'facebook',
    status: 'published',
    campaign: 'Brand Awareness',
    createdAt: new Date('2024-01-13T09:15:00'),
    publishedAt: new Date('2024-01-13T16:30:00'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onPublish: () => console.log('Publish clicked'),
    onDuplicate: () => console.log('Duplicate clicked'),
  },
}

// Contenido rechazado
export const RejectedContent: Story = {
  args: {
    id: '4',
    title: 'Holiday Special Offer',
    description: 'Limited time offer for the holiday season. Get up to 50% off on selected items.',
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
    type: 'twitter',
    status: 'rejected',
    campaign: 'Holiday Campaign',
    createdAt: new Date('2024-01-12T11:45:00'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onPublish: () => console.log('Publish clicked'),
    onDuplicate: () => console.log('Duplicate clicked'),
  },
}

// Contenido de blog
export const BlogContent: Story = {
  args: {
    id: '5',
    title: 'The Future of Digital Marketing',
    description: 'Explore the latest trends and technologies that are shaping the future of digital marketing and how businesses can adapt.',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
    type: 'blog',
    status: 'pending',
    campaign: 'Thought Leadership',
    createdAt: new Date('2024-01-11T13:20:00'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onPublish: () => console.log('Publish clicked'),
    onDuplicate: () => console.log('Duplicate clicked'),
  },
}

// Sin imagen
export const WithoutImage: Story = {
  args: {
    id: '6',
    title: 'Text-Only Post',
    description: 'This is a text-only post without an image. Perfect for sharing thoughts, quotes, or announcements.',
    type: 'twitter',
    status: 'draft',
    campaign: 'Daily Thoughts',
    createdAt: new Date('2024-01-10T08:30:00'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onPublish: () => console.log('Publish clicked'),
    onDuplicate: () => console.log('Duplicate clicked'),
  },
}

// Grid de contenido
export const ContentGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 max-w-6xl">
      <ContentCard
        id="1"
        title="Summer Collection Launch"
        description="Introducing our vibrant summer collection with bold colors and comfortable fabrics."
        imageUrl="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop"
        type="instagram"
        status="published"
        campaign="Summer 2024"
        createdAt={new Date('2024-01-15T10:30:00')}
        publishedAt={new Date('2024-01-15T14:00:00')}
        onEdit={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
        onDuplicate={() => {}}
      />
      <ContentCard
        id="2"
        title="Product Demo Video"
        description="Watch how our latest product can transform your daily workflow and boost productivity."
        imageUrl="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"
        type="linkedin"
        status="approved"
        campaign="Product Demo Series"
        createdAt={new Date('2024-01-14T14:20:00')}
        onEdit={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
        onDuplicate={() => {}}
      />
      <ContentCard
        id="3"
        title="Team Building Event"
        description="Our team had an amazing time at the annual team building event. Great memories were made!"
        imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop"
        type="facebook"
        status="draft"
        campaign="Company Culture"
        createdAt={new Date('2024-01-13T09:15:00')}
        onEdit={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
        onDuplicate={() => {}}
      />
      <ContentCard
        id="4"
        title="Quick Tip Tuesday"
        description="Here's a quick tip to improve your social media engagement rates."
        type="twitter"
        status="pending"
        campaign="Weekly Tips"
        createdAt={new Date('2024-01-12T11:45:00')}
        onEdit={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
        onDuplicate={() => {}}
      />
      <ContentCard
        id="5"
        title="Industry Insights Report"
        description="Our comprehensive analysis of the latest industry trends and what they mean for your business."
        imageUrl="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop"
        type="blog"
        status="rejected"
        campaign="Thought Leadership"
        createdAt={new Date('2024-01-11T13:20:00')}
        onEdit={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
        onDuplicate={() => {}}
      />
      <ContentCard
        id="6"
        title="Newsletter Signup"
        description="Join our newsletter to stay updated with the latest news, tips, and exclusive offers."
        imageUrl="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop"
        type="email"
        status="draft"
        campaign="Newsletter Growth"
        createdAt={new Date('2024-01-10T08:30:00')}
        onEdit={() => {}}
        onDelete={() => {}}
        onPublish={() => {}}
        onDuplicate={() => {}}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Grid de ContentCards mostrando diferentes tipos de contenido y estados.',
      },
    },
  },
}