import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import { Toaster } from '@/components/ui/toast'
import { TourProvider } from '@/components/onboarding/tour-provider'
import { NavigationProvider } from '@/components/navigation/navigation-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Postia SaaS - AI Content Generation',
  description: 'Automated content generation for marketing agencies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <NavigationProvider>
            <TourProvider>
              {children}
              <Toaster />
            </TourProvider>
          </NavigationProvider>
        </SessionProvider>
      </body>
    </html>
  )
}