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

  // Get agency data
  const agency = await db.agency.findUnique({
    where: { id: session.user.agencyId },
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.name}
          </h1>
          <p className="text-gray-600 mt-2">
            {agency.name} Dashboard
          </p>
        </div>

        <DashboardOverview 
          agency={agency}
          stats={stats}
          recentJobs={agency.jobs}
        />
      </div>
    </div>
  )
}