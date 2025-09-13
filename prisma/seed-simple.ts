import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo agency
  const agency = await prisma.agency.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Marketing Agency',
      slug: 'demo-agency',
      tokenBalance: 10000,
    },
  })

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@postia.com' },
    update: {},
    create: {
      email: 'demo@postia.com',
      name: 'Demo User',
      role: 'ADMIN',
      agencyId: agency.id,
    },
  })

  // Create demo client
  const client = await prisma.client.upsert({
    where: { id: 'demo-client' },
    update: {},
    create: {
      id: 'demo-client',
      name: 'Demo Tech Company',
      email: 'client@demo.com',
      agencyId: agency.id,
      settings: JSON.stringify({
        brandColors: ['#007bff', '#28a745'],
        brandStyle: 'modern',
        industry: 'technology',
        targetAudience: 'B2B professionals',
        brandTone: 'professional'
      }),
    },
  })

  // Create demo campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Q1 2024 Content Campaign',
      description: 'Quarterly content marketing campaign',
      clientId: client.id,
      agencyId: agency.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      settings: JSON.stringify({
        platforms: ['instagram', 'facebook', 'twitter'],
        contentMix: {
          textOnly: 30,
          singleImage: 50,
          carousel: 15,
          video: 5
        }
      }),
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📧 Demo user: demo@postia.com`)
  console.log(`🏢 Agency: ${agency.name}`)
  console.log(`👤 Client: ${client.name}`)
  console.log(`📊 Campaign: ${campaign.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })