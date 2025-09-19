'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveDropdownMenu as DropdownMenu,
  ResponsiveDropdownMenuContent as DropdownMenuContent,
  ResponsiveDropdownMenuItem as DropdownMenuItem,
  ResponsiveDropdownMenuLabel as DropdownMenuLabel,
  ResponsiveDropdownMenuSeparator as DropdownMenuSeparator,
  ResponsiveDropdownMenuTrigger as DropdownMenuTrigger,
} from '@/components/ui/responsive-dropdown'
import { Input } from '@/components/ui/input'
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Building2,
  ArrowLeft,
  Menu
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMobile } from '@/hooks/use-mobile'

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void
}

export default function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()
  const [searchQuery, setSearchQuery] = useState('')

  // Generate breadcrumb from pathname
  const generateBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbItems = []

    // Always start with Admin
    breadcrumbItems.push({ label: 'Admin', href: '/dashboard/admin' })

    // Add subsequent segments
    if (segments.length > 2) {
      const adminSegments = segments.slice(2) // Skip 'dashboard' and 'admin'
      let currentPath = '/dashboard/admin'

      adminSegments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ')
        breadcrumbItems.push({ label, href: currentPath })
      })
    }

    return breadcrumbItems
  }

  const breadcrumbs = generateBreadcrumb()

  const handleBackToClientMode = () => {
    router.push('/dashboard')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/admin/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={item.href} className="flex items-center space-x-2">
                {index > 0 && (
                  <span className="text-muted-foreground">/</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-1 ${
                    index === breadcrumbs.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  {item.label}
                </Button>
              </div>
            ))}
          </nav>

          {/* Back to Client Mode - Desktop */}
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToClientMode}
              className="ml-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Client Mode
            </Button>
          )}
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients, campaigns, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="space-y-2 p-2">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">New client registered</p>
                  <p className="text-xs text-muted-foreground">TechCorp just signed up</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Campaign completed</p>
                  <p className="text-xs text-muted-foreground">Summer Sale campaign finished</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-muted-foreground">$2,500 from RetailPlus</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Button variant="ghost" size="sm" className="w-full">
                  View all notifications
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                {!isMobile && (
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {session?.user?.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-muted-foreground">Agency Owner</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {session?.user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.user?.email || 'admin@agency.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/admin/billing')}>
                <Building2 className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Back to Client Mode - Mobile */}
              {isMobile && (
                <>
                  <DropdownMenuItem onClick={handleBackToClientMode}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Client Mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}