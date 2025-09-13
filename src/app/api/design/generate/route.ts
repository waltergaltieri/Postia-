import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { 
  selectOptimalTemplate, 
  generateFinalDesign,
  type TemplateSelectionRequest,
  type DesignGenerationRequest 
} from '@/lib/services/template-engine';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.GENERATE_CONTENT)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to generate designs' } },
        { status: 403 }
      );
    }

    const {
      clientId,
      campaignId,
      contentType = 'social_post',
      platform = 'instagram',
      content,
      customizations = {},
      autoSelectTemplate = true,
      templateId
    } = await request.json();

    // Validate required fields
    if (!clientId || !content?.headline) {
      return NextResponse.json(
        { error: { message: 'Client ID and headline are required' } },
        { status: 400 }
      );
    }

    // Get client information
    const client = await db.client.findUnique({
      where: { 
        id: clientId,
        agencyId: session.user.agencyId 
      },
      include: {
        agency: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: { message: 'Client not found or access denied' } },
        { status: 404 }
      );
    }

    // Get campaign information if provided
    let campaign = null;
    if (campaignId) {
      campaign = await db.campaign.findUnique({
        where: { 
          id: campaignId,
          clientId: clientId 
        }
      });
    }

    let selectedTemplate;

    // Step 1: Select template (either auto-select or use provided)
    if (autoSelectTemplate && !templateId) {
      const templateRequest: TemplateSelectionRequest = {
        contentType,
        platform,
        brandStyle: client.settings?.brandStyle || 'professional',
        industry: client.settings?.industry,
        campaignObjective: campaign?.objective,
        targetAudience: client.settings?.targetAudience,
        brandColors: client.settings?.brandColors || ['#007bff']
      };

      selectedTemplate = await selectOptimalTemplate(
        templateRequest,
        session.user.agencyId,
        session.user.id
      );
    } else if (templateId) {
      // Use specific template ID
      // In a real implementation, fetch from database
      selectedTemplate = { id: templateId }; // Simplified for now
    } else {
      return NextResponse.json(
        { error: { message: 'Either enable auto-selection or provide template ID' } },
        { status: 400 }
      );
    }

    // Step 2: Generate final design
    const designRequest: DesignGenerationRequest = {
      templateId: selectedTemplate.id,
      content: {
        headline: content.headline,
        subheadline: content.subheadline,
        body: content.body,
        cta: content.cta
      },
      assets: {
        productImages: content.productImages || [],
        logoUrl: client.settings?.logoUrl,
        brandColors: client.settings?.brandColors || ['#007bff']
      },
      customizations: {
        backgroundPrompt: customizations.backgroundPrompt,
        productPrompt: customizations.productPrompt,
        style: customizations.style || client.settings?.brandStyle
      }
    };

    const designResult = await generateFinalDesign(
      designRequest,
      session.user.agencyId,
      session.user.id
    );

    // Create design record in database
    const designRecord = await db.contentJob.create({
      data: {
        agencyId: session.user.agencyId,
        userId: session.user.id,
        clientId: clientId,
        campaignId: campaignId,
        type: 'DESIGN_GENERATION',
        status: 'COMPLETED',
        tokensConsumed: Math.ceil(designResult.metadata.totalCost * 1000),
        result: {
          templateId: selectedTemplate.id,
          finalImageUrl: designResult.finalImageUrl,
          thumbnailUrl: designResult.thumbnailUrl,
          content: content,
          generatedAssets: designResult.generatedAssets,
          metadata: designResult.metadata
        },
        metadata: {
          platform,
          contentType,
          templateSelection: 'auto',
          generationTime: designResult.metadata.generationTime,
          stepsCompleted: designResult.metadata.stepsCompleted
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: designRecord.id,
        templateId: selectedTemplate.id,
        template: designResult.template,
        finalImageUrl: designResult.finalImageUrl,
        thumbnailUrl: designResult.thumbnailUrl,
        content: content,
        generatedAssets: designResult.generatedAssets,
        metadata: {
          generationTime: designResult.metadata.generationTime,
          totalCost: designResult.metadata.totalCost,
          stepsCompleted: designResult.metadata.stepsCompleted,
          tokensConsumed: Math.ceil(designResult.metadata.totalCost * 1000)
        }
      }
    });

  } catch (error) {
    console.error('Design generation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to generate design',
          type: 'DESIGN_GENERATION_ERROR'
        } 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'universal';
    const contentType = searchParams.get('contentType') || 'social_post';
    const category = searchParams.get('category');

    // In a real implementation, fetch from database with filters
    const mockTemplates = [
      {
        id: 'modern_product_showcase',
        name: 'Modern Product Showcase',
        category: 'social_post',
        platform: 'universal',
        thumbnailUrl: 'https://templates.postia.com/thumbs/modern_product_showcase.jpg',
        description: 'Plantilla moderna para destacar productos',
        metadata: {
          style: 'modern',
          industry: ['tech', 'retail'],
          difficulty: 'medium'
        }
      },
      {
        id: 'minimal_announcement',
        name: 'Minimal Announcement',
        category: 'social_post',
        platform: 'universal',
        thumbnailUrl: 'https://templates.postia.com/thumbs/minimal_announcement.jpg',
        description: 'Diseño minimalista para anuncios',
        metadata: {
          style: 'minimal',
          industry: ['services', 'tech'],
          difficulty: 'simple'
        }
      },
      {
        id: 'bold_promotion',
        name: 'Bold Promotion',
        category: 'social_post',
        platform: 'universal',
        thumbnailUrl: 'https://templates.postia.com/thumbs/bold_promotion.jpg',
        description: 'Diseño llamativo para promociones',
        metadata: {
          style: 'bold',
          industry: ['retail', 'food'],
          difficulty: 'medium'
        }
      }
    ];

    // Filter templates based on query parameters
    let filteredTemplates = mockTemplates;
    
    if (platform !== 'universal') {
      filteredTemplates = filteredTemplates.filter(t => 
        t.platform === platform || t.platform === 'universal'
      );
    }
    
    if (contentType !== 'social_post') {
      filteredTemplates = filteredTemplates.filter(t => t.category === contentType);
    }
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.metadata.industry.includes(category)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: filteredTemplates,
        total: filteredTemplates.length,
        filters: {
          platform,
          contentType,
          category
        }
      }
    });

  } catch (error) {
    console.error('Template retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to retrieve templates',
          type: 'TEMPLATE_RETRIEVAL_ERROR'
        } 
      },
      { status: 500 }
    );
  }
}