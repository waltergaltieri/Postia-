import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo agency
  const agency = await prisma.agency.upsert({
    where: { slug: 'demo-agency' },
    update: {
      name: 'Demo Marketing Agency',
      tokenBalance: 1000,
    },
    create: {
      name: 'Demo Marketing Agency',
      slug: 'demo-agency',
      tokenBalance: 1000,
    },
  });

  // Create demo admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'ADMIN',
      agencyId: agency.id,
    },
  });

  // Create demo client
  const client = await prisma.client.upsert({
    where: { id: 'demo-client' },
    update: {},
    create: {
      id: 'demo-client',
      name: 'Demo Client Corp',
      email: 'client@demo.com',
      agencyId: agency.id,
      settings: JSON.stringify({
        brandGuidelines: 'Professional, modern, tech-focused',
        targetAudience: 'B2B professionals',
        contentTone: 'Professional yet approachable',
      }),
    },
  });

  // Create demo campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Q1 2024 Social Media Campaign',
      description: 'Quarterly social media content campaign',
      clientId: client.id,
      agencyId: agency.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      settings: JSON.stringify({
        platforms: ['twitter', 'linkedin', 'facebook'],
        postFrequency: 'daily',
        contentTypes: ['text', 'image', 'video'],
      }),
    },
  });

  // Create demo content job
  await prisma.contentJob.create({
    data: {
      agencyId: agency.id,
      userId: adminUser.id,
      clientId: client.id,
      campaignId: campaign.id,
      type: 'CAMPAIGN_CONTENT',
      status: 'COMPLETED',
      tokensConsumed: 50,
      result: JSON.stringify({
        content: 'Demo social media post generated successfully',
        platform: 'twitter',
        engagement: 'high'
      }),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📧 Admin user: admin@demo.com`);
  console.log(`🏢 Agency: ${agency.name}`);
  console.log(`👤 Client: ${client.name}`);
  console.log(`📊 Campaign: ${campaign.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });