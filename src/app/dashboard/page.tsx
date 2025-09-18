import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Debug: Log session data
  console.log('Dashboard session:', JSON.stringify(session, null, 2))
  
  // Check if user exists in database
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, agencyId: true, role: true, email: true }
  })
  
  if (!dbUser) {
    console.log('User not found in database, redirecting to sign in')
    redirect('/auth/signin')
  }
  
  // Check if user has agencyId
  if (!dbUser.agencyId) {
    console.log('No agencyId found, redirecting to registration')
    redirect('/auth/complete-registration')
  }

  // Get agency data
  const agency = await db.agency.findUnique({
    where: { id: dbUser.agencyId },
    include: {
      clients: {
        include: {
          campaigns: {
            where: { status: 'ACTIVE' }
          }
        }
      },
      jobs: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!agency) {
    return <div>Agency not found</div>
  }

  const stats = {
    totalClients: agency.clients.length,
    activeCampaigns: agency.clients.reduce((sum, client) => sum + client.campaigns.length, 0),
    tokenBalance: agency.tokenBalance,
    recentJobs: agency.jobs.length
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          {agency.name} Dashboard
        </p>
      </div>

      <DashboardOverview 
        agency={agency}
        stats={stats}
        recentJobs={agency.jobs}
      />
    </div>
  )
}