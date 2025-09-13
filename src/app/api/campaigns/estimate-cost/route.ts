import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';
import { TokenConsumptionService } from '@/lib/services/token-consumption';

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
    if (!hasPermission(session.user.role as UserRole, PERMISSIONS.VIEW_CAMPAIGNS)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions to estimate campaign costs' } },
        { status: 403 }
      );
    }

    const { 
      postsCount, 
      includeImages = true, 
      regenerationBuffer = 0.2,
      platforms = ['facebook', 'instagram'],
      contentTypes = ['post', 'story']
    } = await request.json();

    // Validate input
    if (!postsCount || postsCount <= 0) {
      return NextResponse.json(
        { error: { message: 'Posts count must be a positive number' } },
        { status: 400 }
      );
    }

    if (postsCount > 1000) {
      return NextResponse.json(
        { error: { message: 'Posts count cannot exceed 1000' } },
        { status: 400 }
      );
    }

    // Calculate token requirements
    const estimatedTokens = TokenConsumptionService.estimateCampaignTokens(
      postsCount,
      includeImages,
      regenerationBuffer
    );

    // Check if agency can afford this campaign
    const affordability = await TokenConsumptionService.canAffordCampaign(
      session.user.agencyId,
      postsCount,
      includeImages
    );

    // Get detailed breakdown
    const tokenCosts = TokenConsumptionService.getTokenCosts();
    const steps = ['IDEA', 'COPY_DESIGN', 'COPY_PUBLICATION'];
    if (includeImages) {
      steps.push('BASE_IMAGE', 'FINAL_DESIGN');
    }

    const breakdown = steps.map(step => {
      let cost = 0;
      switch (step) {
        case 'IDEA':
          cost = tokenCosts.IDEA_GENERATION;
          break;
        case 'COPY_DESIGN':
          cost = tokenCosts.COPY_DESIGN;
          break;
        case 'COPY_PUBLICATION':
          cost = tokenCosts.COPY_PUBLICATION;
          break;
        case 'BASE_IMAGE':
          cost = tokenCosts.BASE_IMAGE;
          break;
        case 'FINAL_DESIGN':
          cost = tokenCosts.FINAL_DESIGN;
          break;
      }
      
      return {
        step,
        tokensPerPost: cost,
        totalTokens: cost * postsCount,
      };
    });

    const baseTokens = breakdown.reduce((sum, item) => sum + item.totalTokens, 0);
    const bufferTokens = Math.ceil(baseTokens * regenerationBuffer);

    // Calculate additional costs
    const additionalCosts = {
      socialPublishing: platforms.length * postsCount * tokenCosts.SOCIAL_PUBLISHING,
      analytics: Math.ceil(postsCount * 0.1) * tokenCosts.SOCIAL_ANALYTICS,
    };

    const totalAdditionalTokens = Object.values(additionalCosts).reduce((sum, cost) => sum + cost, 0);

    // Get current balance and usage
    const balanceSummary = await TokenConsumptionService.getBalanceSummary(session.user.agencyId);

    return NextResponse.json({
      success: true,
      data: {
        estimate: {
          postsCount,
          includeImages,
          regenerationBuffer,
          platforms,
          contentTypes,
        },
        tokenBreakdown: {
          baseTokens,
          bufferTokens,
          additionalTokens: totalAdditionalTokens,
          totalTokens: estimatedTokens + totalAdditionalTokens,
          breakdown,
          additionalCosts,
        },
        affordability: {
          ...affordability,
          required: estimatedTokens + totalAdditionalTokens,
          shortfall: Math.max(0, (estimatedTokens + totalAdditionalTokens) - affordability.available),
        },
        currentBalance: balanceSummary,
        recommendations: generateRecommendations(
          affordability,
          estimatedTokens + totalAdditionalTokens,
          balanceSummary,
          postsCount
        ),
      },
    });
  } catch (error) {
    console.error('Campaign cost estimation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Failed to estimate campaign cost' 
        } 
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  affordability: { canAfford: boolean; required: number; available: number },
  totalRequired: number,
  balanceSummary: any,
  postsCount: number
): string[] {
  const recommendations: string[] = [];

  if (!affordability.canAfford) {
    const shortfall = totalRequired - affordability.available;
    recommendations.push(
      `You need ${shortfall} more tokens to complete this campaign. Consider purchasing additional tokens.`
    );

    // Suggest reducing scope
    if (postsCount > 10) {
      const reducedPosts = Math.floor((affordability.available / totalRequired) * postsCount);
      recommendations.push(
        `Alternatively, you could create ${reducedPosts} posts with your current balance.`
      );
    }
  } else {
    const remainingAfter = affordability.available - totalRequired;
    recommendations.push(
      `You have sufficient tokens. You'll have ${remainingAfter} tokens remaining after this campaign.`
    );

    // Suggest optimization
    if (balanceSummary.monthlyUsage > 0) {
      const monthlyRate = balanceSummary.monthlyUsage;
      const daysRemaining = Math.floor(remainingAfter / (monthlyRate / 30));
      recommendations.push(
        `At your current usage rate, remaining tokens will last approximately ${daysRemaining} days.`
      );
    }
  }

  // Subscription recommendations
  if (balanceSummary.subscriptionPlan === 'BASIC' && totalRequired > 500) {
    recommendations.push(
      'Consider upgrading to a higher subscription plan for better token allocation and cost efficiency.'
    );
  }

  return recommendations;
}