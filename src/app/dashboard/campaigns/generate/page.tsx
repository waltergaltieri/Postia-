import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import CampaignGenerator from '@/components/campaigns/CampaignGenerator'

export default async function GenerateCampaignPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get clients and campaigns for the agency
  const clients = await db.client.findMany({
    where: { agencyId: session.user.agencyId },
    include: {
      campaigns: {
        where: { status: 'ACTIVE' }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Generate Campaign Content
          </h1>
          <p className="text-gray-600 mt-2">
            Create massive content for your campaigns using AI
          </p>
        </div>

        <CampaignGenerator 
          clients={clients}
          agencyId={session.user.agencyId}
          userId={session.user.id}
        />
      </div>
    </div>
  )
}