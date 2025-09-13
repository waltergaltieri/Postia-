import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      contentCount = 10,
      platforms = ['instagram', 'facebook', 'twitter'],
      contentMix = {
        textOnly: 30,
        singleImage: 50,
        carousel: 15,
        video: 5
      }
    } = await request.json();

    console.log('🚀 Starting campaign generation...');
    
    // Get demo data
    const agency = await db.agency.findFirst({
      where: { slug: 'demo-agency' }
    });
    
    const user = await db.user.findFirst({
      where: { email: 'demo@postia.com' }
    });
    
    const client = await db.client.findFirst({
      where: { name: 'Demo Tech Company' }
    });
    
    const campaign = await db.campaign.findFirst({
      where: { name: 'Q1 2024 Content Campaign' }
    });

    if (!agency || !user || !client || !campaign) {
      return NextResponse.json(
        { error: 'Demo data not found. Please run seed first.' },
        { status: 404 }
      );
    }

    // Simulate AI generation process
    console.log('🤖 Step 1: Generating ideas...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✍️ Step 2: Developing content...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('🎨 Step 3: Creating designs...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate realistic content
    const publications = [];
    const contentTypes = ['text_only', 'single_image', 'carousel'];
    
    for (let i = 0; i < contentCount; i++) {
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const platform = platforms[i % platforms.length];
      
      const content = generateRealisticContent(i + 1, contentType, platform);
      
      // Save to database
      const job = await db.contentJob.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          clientId: client.id,
          campaignId: campaign.id,
          type: 'CAMPAIGN_CONTENT',
          status: 'COMPLETED',
          tokensConsumed: Math.floor(Math.random() * 100) + 50,
          scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
          result: JSON.stringify({
            contentType,
            platform,
            content,
            generatedAt: new Date().toISOString()
          }),
          metadata: JSON.stringify({
            aiProvider: Math.random() > 0.5 ? 'openai' : 'gemini',
            generationTime: Math.floor(Math.random() * 5000) + 2000,
            cost: (Math.random() * 0.1 + 0.02).toFixed(4)
          })
        }
      });

      publications.push({
        id: job.id,
        contentType,
        platform,
        scheduledDate: job.scheduledDate,
        content,
        status: 'draft',
        generationMetrics: {
          totalCost: parseFloat(JSON.parse(job.metadata!).cost),
          generationTime: JSON.parse(job.metadata!).generationTime,
          aiProvidersUsed: [JSON.parse(job.metadata!).aiProvider],
          assetsGenerated: contentType === 'text_only' ? 0 : 1
        }
      });
    }

    // Calculate summary
    const totalCost = publications.reduce((sum, pub) => sum + pub.generationMetrics.totalCost, 0);
    const contentMixResult = publications.reduce((mix, pub) => {
      mix[pub.contentType] = (mix[pub.contentType] || 0) + 1;
      return mix;
    }, {} as Record<string, number>);

    console.log('✅ Campaign generated successfully!');

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPosts: publications.length,
          totalCost: totalCost.toFixed(4),
          generationTime: 4500,
          contentMix: contentMixResult
        },
        publications: publications.slice(0, 10), // Return first 10 for preview
        metadata: {
          agencyId: agency.id,
          campaignId: campaign.id,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Campaign generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate campaign content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateRealisticContent(index: number, contentType: string, platform: string) {
  const topics = [
    'productivity', 'innovation', 'technology', 'business growth', 
    'digital transformation', 'team collaboration', 'customer success',
    'market trends', 'industry insights', 'best practices'
  ];
  
  const topic = topics[index % topics.length];
  
  const contentTemplates = {
    productivity: {
      text: `🚀 Boost your ${topic} with these proven strategies. Our latest insights show that teams using modern tools see 40% better results. Ready to transform your workflow?`,
      hashtags: ['#Productivity', '#Efficiency', '#WorkSmart', '#BusinessGrowth', '#Innovation']
    },
    innovation: {
      text: `💡 The future of ${topic} is here! Discover how leading companies are leveraging cutting-edge solutions to stay ahead of the competition. What's your innovation strategy?`,
      hashtags: ['#Innovation', '#Technology', '#FutureOfWork', '#DigitalTransformation', '#Leadership']
    },
    technology: {
      text: `⚡ ${topic.charAt(0).toUpperCase() + topic.slice(1)} just got a major upgrade! See how our latest features are helping businesses achieve unprecedented results. Try it today!`,
      hashtags: ['#Technology', '#TechUpdate', '#BusinessTools', '#Automation', '#Efficiency']
    }
  };

  const template = contentTemplates[topic as keyof typeof contentTemplates] || contentTemplates.productivity;
  
  return {
    text: template.text,
    hashtags: template.hashtags,
    images: contentType !== 'text_only' ? [`https://picsum.photos/400/400?random=${index}`] : undefined,
    designAssets: contentType !== 'text_only' ? [`https://picsum.photos/400/400?random=${index}`] : undefined
  };
}