'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/components/navigation/navigation-context'
import AdminSidebar from '@/components/navigation/admin-sidebar'
import AdminHeader from '@/components/navigation/admin-header'
import { motion } from 'framer-motion'
import { useMobile } from '@/hooks/use-mobile'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useMobile()
  const { switchToAdminDashboard, loading } = useNavigation()

  // Ensure user is in admin mode when accessing admin routes
  useEffect(() => {
    if (status === 'authenticated' && !loading) {
      switchToAdminDashboard()
    }
  }, [status, loading, switchToAdminDashboard])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <AdminHeader />
        <main className="flex-1 overflow-auto pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}