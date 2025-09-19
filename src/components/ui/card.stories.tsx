import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Card premium con sistema de elevación, efectos hover y variantes especializadas para diferentes tipos de contenido.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Card básica
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area where you can place any content.</p>
      </CardContent>
      <CardFooter>
        <Button> <span>Action</span></Button>
      </CardFooter>
    </Card>
  ),
}

// Card con hover effects
export const WithHoverEffects: Story = {
  render: () => (
    <Card className="w-[350px] transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the elevation effect.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card has hover effects with scale and shadow animations.</p>
      </CardContent>
    </Card>
  ),
}

// Content Card para posts
export const ContentCard: Story = {
  render: () => (
    <Card className="w-[350px] overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 relative">
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <span className="text-white font-semibold">Generated Image</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 text-white hover:bg-white/20"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Social Media Post</CardTitle>
            <CardDescription>Generated for Instagram • Campaign: Summer 2024</CardDescription>
          </div>
          <Badge variant="secondary">Draft</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          "Discover the perfect summer vibes with our latest collection. 
          Embrace the warmth and style that defines your unique personality..."
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Heart className="h-4 w-4 mr-1" /> <span>Like</span></Button>
          <Button size="sm" variant="ghost">
            <MessageCircle className="h-4 w-4 mr-1" /> <span>Comment</span></Button>
          <Button size="sm" variant="ghost">
            <Share2 className="h-4 w-4 mr-1" /> <span>Share</span></Button>
        </div>
        <Button size="sm"> <span>Publish</span></Button>
      </CardFooter>
    </Card>
  ),
}

// Analytics Card
export const AnalyticsCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Content Generated</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,234</div>
        <p className="text-xs text-muted-foreground">
          +20.1% from last month
        </p>
        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
        </div>
      </CardContent>
    </Card>
  ),
}

// Client Card
export const ClientCard: Story = {
  render: () => (
    <Card className="w-[280px] cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            AC
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Acme Corp</CardTitle>
            <CardDescription>Technology • 12 campaigns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last activity</span>
          <span>2 hours ago</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">Content generated</span>
          <span className="font-medium">156 posts</span>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Button variant="outline" className="w-full"> <span>Switch to Client</span></Button>
      </CardFooter>
    </Card>
  ),
}

// Notification Card
export const NotificationCard: Story = {
  render: () => (
    <Card className="w-[350px] border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">Content Generation Complete</CardTitle>
            <CardDescription className="text-xs">2 minutes ago</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            AI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">
          Your Instagram post for "Summer Campaign" has been generated successfully. 
          Review and publish when ready.
        </p>
      </CardContent>
      <CardFooter className="pt-3 flex gap-2">
        <Button size="sm" variant="outline"> <span>Dismiss</span></Button>
        <Button size="sm"> <span>Review Content</span></Button>
      </CardFooter>
    </Card>
  ),
}

// Grid de cards
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 max-w-6xl">
      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="text-lg">Project Alpha</CardTitle>
          <CardDescription>Social media campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-3/4" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full"> <span>View Details</span></Button>
        </CardFooter>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="text-lg">Project Beta</CardTitle>
          <CardDescription>Email marketing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-[45%]" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full"> <span>View Details</span></Button>
        </CardFooter>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <CardHeader>
          <CardTitle className="text-lg">Project Gamma</CardTitle>
          <CardDescription>Content strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>90%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-[90%]" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full"> <span>View Details</span></Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}