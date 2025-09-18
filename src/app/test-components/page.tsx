import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ContentCard } from "@/components/ui/content-card"
import { Zap, Star, Download } from "lucide-react"

export default function TestComponentsPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Test Premium Components</h1>
      
      {/* Button Tests */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="default">Default Button</Button>
          <Button variant="premium" icon={<Zap />}>Premium Button</Button>
          <Button variant="success" icon={<Star />}>Success Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="default" loading>Loading Button</Button>
        </div>
      </section>

      {/* Card Tests */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Basic card with subtle elevation</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is a default card with hover effects.</p>
            </CardContent>
          </Card>

          <Card variant="elevated" interactive>
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Card with more prominent shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This card has enhanced elevation and interactive effects.</p>
            </CardContent>
          </Card>

          <Card variant="premium" interactive>
            <CardHeader>
              <CardTitle>Premium Card</CardTitle>
              <CardDescription>Card with gradient border</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is a premium card with gradient border effects.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Content Card Tests */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Content Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ContentCard
            title="Sample Post"
            description="This is a sample social media post with premium styling"
            status="approved"
            contentType="image"
            platform="Instagram"
            createdAt={new Date()}
            onView={() => console.log("View clicked")}
            onEdit={() => console.log("Edit clicked")}
          />
          
          <ContentCard
            title="Video Content"
            description="A promotional video for the summer campaign"
            status="pending"
            contentType="video"
            platform="YouTube"
            createdAt={new Date()}
            scheduledAt={new Date(Date.now() + 86400000)}
          />
          
          <ContentCard
            title="Blog Article"
            description="Comprehensive guide about digital marketing trends"
            status="draft"
            contentType="text"
            platform="Blog"
            createdAt={new Date()}
          />
        </div>
      </section>
    </div>
  )
}