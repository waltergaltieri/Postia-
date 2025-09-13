import { GenerationStep } from '@/generated/prisma';

export interface BrandContext {
  brandName: string;
  industry?: string;
  targetAudience?: string;
  campaignGoals?: string;
  brandGuidelines?: string;
  brandVoice?: string;
  brandValues?: string[];
  competitors?: string[];
  brandAssets?: Array<{
    type: string;
    name: string;
    url: string;
    metadata?: any;
  }>;
}

export interface CampaignContext {
  name: string;
  description?: string;
  platforms: string[];
  startDate: string;
  endDate: string;
  postsPerWeek: number;
  targetAudience?: string;
  campaignGoals?: string;
  brandGuidelines?: string;
}

export interface ContentContext {
  contentType?: 'promotional' | 'educational' | 'entertaining' | 'inspirational' | 'behind-the-scenes';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'inspirational';
  callToAction?: string;
  hashtags?: string[];
  mentions?: string[];
  seasonality?: string;
  trends?: string[];
}

export interface PromptContext {
  brand: BrandContext;
  campaign: CampaignContext;
  content?: ContentContext;
  previousSteps?: Record<string, any>;
  customInstructions?: string;
}

/**
 * Generate dynamic prompt based on context and step
 */
export function generatePrompt(step: GenerationStep, context: PromptContext): string {
  const { brand, campaign, content, previousSteps, customInstructions } = context;

  // Build brand context section
  const brandSection = buildBrandContextSection(brand);
  
  // Build campaign context section
  const campaignSection = buildCampaignContextSection(campaign);
  
  // Build content preferences section
  const contentSection = content ? buildContentContextSection(content) : '';

  // Build previous steps section
  const previousStepsSection = previousSteps ? buildPreviousStepsSection(previousSteps) : '';

  // Custom instructions
  const customSection = customInstructions ? `\nAdditional Instructions:\n${customInstructions}\n` : '';

  switch (step) {
    case GenerationStep.IDEA:
      return buildIdeaPrompt(brandSection, campaignSection, contentSection, customSection);
    
    case GenerationStep.COPY_DESIGN:
      return buildCopyDesignPrompt(brandSection, campaignSection, contentSection, previousStepsSection, customSection);
    
    case GenerationStep.COPY_PUBLICATION:
      return buildCopyPublicationPrompt(brandSection, campaignSection, contentSection, previousStepsSection, customSection);
    
    case GenerationStep.BASE_IMAGE:
      return buildImagePrompt(brandSection, campaignSection, contentSection, previousStepsSection, customSection);
    
    case GenerationStep.FINAL_DESIGN:
      return buildFinalDesignPrompt(brandSection, campaignSection, contentSection, previousStepsSection, customSection);
    
    default:
      throw new Error(`Unknown generation step: ${step}`);
  }
}

/**
 * Build brand context section
 */
function buildBrandContextSection(brand: BrandContext): string {
  let section = `Brand Context:
- Brand Name: ${brand.brandName}`;

  if (brand.industry) {
    section += `\n- Industry: ${brand.industry}`;
  }

  if (brand.targetAudience) {
    section += `\n- Target Audience: ${brand.targetAudience}`;
  }

  if (brand.brandVoice) {
    section += `\n- Brand Voice: ${brand.brandVoice}`;
  }

  if (brand.brandValues && brand.brandValues.length > 0) {
    section += `\n- Brand Values: ${brand.brandValues.join(', ')}`;
  }

  if (brand.brandGuidelines) {
    section += `\n- Brand Guidelines: ${brand.brandGuidelines}`;
  }

  if (brand.competitors && brand.competitors.length > 0) {
    section += `\n- Key Competitors: ${brand.competitors.join(', ')}`;
  }

  if (brand.brandAssets && brand.brandAssets.length > 0) {
    section += `\n- Available Brand Assets: ${brand.brandAssets.map(asset => `${asset.type} (${asset.name})`).join(', ')}`;
  }

  return section;
}

/**
 * Build campaign context section
 */
function buildCampaignContextSection(campaign: CampaignContext): string {
  let section = `\nCampaign Context:
- Campaign Name: ${campaign.name}
- Platforms: ${campaign.platforms.join(', ')}
- Duration: ${campaign.startDate} to ${campaign.endDate}
- Posting Frequency: ${campaign.postsPerWeek} posts per week`;

  if (campaign.description) {
    section += `\n- Campaign Description: ${campaign.description}`;
  }

  if (campaign.targetAudience) {
    section += `\n- Campaign Target Audience: ${campaign.targetAudience}`;
  }

  if (campaign.campaignGoals) {
    section += `\n- Campaign Goals: ${campaign.campaignGoals}`;
  }

  return section;
}

/**
 * Build content context section
 */
function buildContentContextSection(content: ContentContext): string {
  let section = `\nContent Preferences:`;

  if (content.contentType) {
    section += `\n- Content Type: ${content.contentType}`;
  }

  if (content.tone) {
    section += `\n- Preferred Tone: ${content.tone}`;
  }

  if (content.callToAction) {
    section += `\n- Call to Action: ${content.callToAction}`;
  }

  if (content.hashtags && content.hashtags.length > 0) {
    section += `\n- Suggested Hashtags: ${content.hashtags.join(', ')}`;
  }

  if (content.mentions && content.mentions.length > 0) {
    section += `\n- Mentions: ${content.mentions.join(', ')}`;
  }

  if (content.seasonality) {
    section += `\n- Seasonality: ${content.seasonality}`;
  }

  if (content.trends && content.trends.length > 0) {
    section += `\n- Current Trends: ${content.trends.join(', ')}`;
  }

  return section;
}

/**
 * Build previous steps section
 */
function buildPreviousStepsSection(previousSteps: Record<string, any>): string {
  let section = `\nPrevious Generation Steps:`;

  if (previousSteps[GenerationStep.IDEA]) {
    section += `\n- Content Idea: ${JSON.stringify(previousSteps[GenerationStep.IDEA])}`;
  }

  if (previousSteps[GenerationStep.COPY_DESIGN]) {
    section += `\n- Design Copy: ${previousSteps[GenerationStep.COPY_DESIGN]}`;
  }

  if (previousSteps[GenerationStep.COPY_PUBLICATION]) {
    section += `\n- Publication Copy: ${previousSteps[GenerationStep.COPY_PUBLICATION]}`;
  }

  if (previousSteps[GenerationStep.BASE_IMAGE]) {
    section += `\n- Base Image: ${JSON.stringify(previousSteps[GenerationStep.BASE_IMAGE])}`;
  }

  return section;
}

/**
 * Build idea generation prompt
 */
function buildIdeaPrompt(brandSection: string, campaignSection: string, contentSection: string, customSection: string): string {
  return `You are a creative social media strategist with expertise in viral content creation and brand storytelling.

${brandSection}${campaignSection}${contentSection}${customSection}

Your Task:
Generate 3 compelling content ideas for social media posts that will resonate with the target audience and achieve the campaign goals.

Requirements:
- Each idea should be unique and creative
- Align with brand voice and values
- Consider platform-specific best practices
- Include engagement hooks and emotional triggers
- Be authentic to the brand's personality
- Consider current social media trends
- Ensure ideas are actionable and feasible

For each idea, provide:
1. Core concept and hook
2. Why it would work for this brand/audience
3. Suggested content format (video, carousel, single image, etc.)
4. Key messaging points
5. Potential engagement strategies

Format your response as JSON:
{
  "ideas": [
    {
      "title": "Compelling title for the idea",
      "concept": "Detailed description of the core concept",
      "hook": "The main engagement hook",
      "reasoning": "Why this would work for the brand and audience",
      "format": "Suggested content format",
      "keyMessages": ["message 1", "message 2", "message 3"],
      "engagementStrategy": "How to maximize engagement",
      "platforms": ["FACEBOOK", "INSTAGRAM", "LINKEDIN"],
      "estimatedReach": "low/medium/high",
      "difficulty": "easy/medium/hard"
    }
  ],
  "recommendedIdea": 0,
  "alternativeApproaches": ["approach 1", "approach 2"]
}`;
}

/**
 * Build copy design prompt
 */
function buildCopyDesignPrompt(brandSection: string, campaignSection: string, contentSection: string, previousStepsSection: string, customSection: string): string {
  return `You are a professional copywriter specializing in social media content with expertise in persuasive writing and brand voice adaptation.

${brandSection}${campaignSection}${contentSection}${previousStepsSection}${customSection}

Your Task:
Create compelling copy based on the selected content idea. This copy will be used as the foundation for the final publication content.

Requirements:
- Write in the brand's voice and tone
- Create multiple variations for A/B testing
- Include strong hooks and calls-to-action
- Optimize for the specified platforms
- Incorporate storytelling elements
- Use persuasive writing techniques
- Ensure copy is scannable and engaging
- Include relevant hashtags and mentions

Provide:
1. Primary copy version (main version)
2. Alternative variations (2-3 versions)
3. Platform-specific adaptations
4. Hashtag recommendations
5. Call-to-action options

Format your response as JSON:
{
  "primaryCopy": {
    "headline": "Attention-grabbing headline",
    "body": "Main copy text with line breaks preserved",
    "callToAction": "Primary CTA",
    "tone": "Tone used",
    "wordCount": 150
  },
  "variations": [
    {
      "version": "A",
      "headline": "Alternative headline",
      "body": "Alternative copy text",
      "callToAction": "Alternative CTA",
      "focus": "What makes this version different"
    }
  ],
  "platformAdaptations": {
    "FACEBOOK": "Facebook-optimized version",
    "INSTAGRAM": "Instagram-optimized version",
    "LINKEDIN": "LinkedIn-optimized version"
  },
  "hashtags": {
    "primary": ["#hashtag1", "#hashtag2"],
    "secondary": ["#hashtag3", "#hashtag4"],
    "trending": ["#trend1", "#trend2"]
  },
  "ctaOptions": ["CTA option 1", "CTA option 2", "CTA option 3"],
  "keyElements": ["element 1", "element 2", "element 3"]
}`;
}

/**
 * Build copy publication prompt
 */
function buildCopyPublicationPrompt(brandSection: string, campaignSection: string, contentSection: string, previousStepsSection: string, customSection: string): string {
  return `You are a social media publishing expert with deep knowledge of platform algorithms, character limits, and engagement optimization.

${brandSection}${campaignSection}${contentSection}${previousStepsSection}${customSection}

Your Task:
Create final, publication-ready copy optimized for each specified platform. This copy should be ready to post immediately.

Requirements:
- Optimize for each platform's algorithm and best practices
- Respect character limits and formatting guidelines
- Include platform-appropriate emojis and formatting
- Optimize hashtag placement and quantity
- Ensure accessibility (alt text suggestions, clear language)
- Include engagement prompts and conversation starters
- Consider optimal posting times and audience behavior
- Make copy mobile-friendly and scannable

Platform-Specific Considerations:
- Facebook: Longer form content, storytelling, community building
- Instagram: Visual-first, hashtags, Stories-friendly
- LinkedIn: Professional tone, industry insights, networking

Format your response as JSON:
{
  "platforms": {
    "FACEBOOK": {
      "content": "Facebook-ready content with proper formatting",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "characterCount": 280,
      "engagementPrompt": "Question or prompt to encourage comments",
      "postingTips": ["tip 1", "tip 2"],
      "altText": "Alt text for images"
    },
    "INSTAGRAM": {
      "content": "Instagram-ready content",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
      "characterCount": 150,
      "storyVersion": "Shorter version for Stories",
      "engagementPrompt": "Call for user-generated content",
      "altText": "Alt text for images"
    },
    "LINKEDIN": {
      "content": "LinkedIn-ready professional content",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "characterCount": 200,
      "industryAngle": "Professional insight or industry connection",
      "networkingPrompt": "Professional networking prompt",
      "altText": "Alt text for images"
    }
  },
  "universalElements": {
    "coreMessage": "The main message across all platforms",
    "brandVoice": "How brand voice is maintained",
    "callToAction": "Primary CTA",
    "keyHashtags": ["#brand", "#campaign"]
  },
  "engagementStrategy": {
    "timing": "Optimal posting times",
    "followUp": "How to engage with comments",
    "crossPromotion": "How to promote across platforms"
  },
  "accessibility": {
    "altText": "Comprehensive alt text",
    "readability": "Readability score and improvements",
    "inclusivity": "Inclusive language considerations"
  }
}`;
}

/**
 * Build image prompt
 */
function buildImagePrompt(brandSection: string, campaignSection: string, contentSection: string, previousStepsSection: string, customSection: string): string {
  return `You are a creative director and visual strategist with expertise in social media imagery, brand aesthetics, and visual storytelling.

${brandSection}${campaignSection}${contentSection}${previousStepsSection}${customSection}

Your Task:
Create detailed image generation prompts that will produce visually compelling images aligned with the brand and content strategy.

Requirements:
- Align with brand visual identity and guidelines
- Consider platform-specific image requirements
- Create engaging, scroll-stopping visuals
- Ensure accessibility and inclusivity
- Incorporate current design trends appropriately
- Consider brand colors, fonts, and visual elements
- Make images shareable and memorable
- Ensure professional quality and brand consistency

Provide multiple prompt variations for different approaches and A/B testing.

Format your response as JSON:
{
  "primaryPrompt": {
    "prompt": "Detailed image generation prompt",
    "style": "Visual style (realistic, artistic, minimalist, etc.)",
    "composition": "Composition guidelines",
    "colorPalette": "Suggested colors based on brand",
    "mood": "Intended mood and feeling",
    "elements": ["key visual element 1", "key visual element 2"],
    "aspectRatio": "1:1",
    "quality": "standard"
  },
  "variations": [
    {
      "name": "Variation A - Close-up focus",
      "prompt": "Alternative prompt focusing on close-up details",
      "reasoning": "Why this variation would work",
      "style": "Visual style",
      "mood": "Different mood approach"
    },
    {
      "name": "Variation B - Lifestyle context",
      "prompt": "Alternative prompt with lifestyle context",
      "reasoning": "Why this variation would work",
      "style": "Visual style",
      "mood": "Different mood approach"
    }
  ],
  "platformOptimizations": {
    "FACEBOOK": {
      "aspectRatio": "16:9",
      "focus": "What to emphasize for Facebook",
      "textOverlay": "Suggested text overlay approach"
    },
    "INSTAGRAM": {
      "aspectRatio": "1:1",
      "focus": "What to emphasize for Instagram",
      "storyVersion": "9:16 aspect ratio considerations"
    },
    "LINKEDIN": {
      "aspectRatio": "1.91:1",
      "focus": "Professional focus for LinkedIn",
      "businessContext": "How to make it business-appropriate"
    }
  },
  "brandElements": {
    "colorScheme": ["#color1", "#color2", "#color3"],
    "typography": "Font style suggestions",
    "logoPlacement": "Where and how to include logo",
    "brandPatterns": "Brand-specific visual patterns"
  },
  "technicalSpecs": {
    "resolution": "Recommended resolution",
    "fileFormat": "Preferred file format",
    "compression": "Compression guidelines",
    "accessibility": "Alt text and accessibility considerations"
  },
  "creativeDirection": {
    "inspiration": "Creative inspiration sources",
    "avoidElements": ["element to avoid 1", "element to avoid 2"],
    "mustInclude": ["must include element 1", "must include element 2"],
    "seasonality": "Seasonal considerations"
  }
}`;
}

/**
 * Build final design prompt
 */
function buildFinalDesignPrompt(brandSection: string, campaignSection: string, contentSection: string, previousStepsSection: string, customSection: string): string {
  return `You are a social media content director responsible for final content assembly, quality assurance, and optimization.

${brandSection}${campaignSection}${contentSection}${previousStepsSection}${customSection}

Your Task:
Compile and optimize all generated elements into final, publication-ready social media content with comprehensive metadata and publishing guidelines.

Requirements:
- Ensure all elements work together cohesively
- Provide final quality assurance and recommendations
- Include comprehensive publishing guidelines
- Suggest optimal posting strategies
- Provide performance tracking recommendations
- Ensure brand consistency across all elements
- Include accessibility and compliance checks
- Provide backup options and alternatives

Format your response as JSON:
{
  "finalContent": {
    "contentId": "unique-content-id",
    "title": "Content title for internal reference",
    "description": "Brief description of the final content",
    "status": "ready-for-review",
    "createdAt": "timestamp",
    "version": "1.0"
  },
  "contentElements": {
    "idea": "Final selected and refined idea",
    "copy": "Final copy for each platform",
    "images": "Final image selections and specifications",
    "hashtags": "Final hashtag strategy",
    "callToAction": "Final call-to-action"
  },
  "publishingPlan": {
    "platforms": ["FACEBOOK", "INSTAGRAM", "LINKEDIN"],
    "scheduledTimes": {
      "FACEBOOK": "optimal posting time",
      "INSTAGRAM": "optimal posting time",
      "LINKEDIN": "optimal posting time"
    },
    "postingSequence": "Order and timing of posts across platforms",
    "crossPromotion": "How to cross-promote between platforms"
  },
  "qualityAssurance": {
    "brandCompliance": "Brand guideline compliance check",
    "accessibility": "Accessibility compliance",
    "legalReview": "Any legal considerations",
    "factChecking": "Fact-checking requirements",
    "approvalStatus": "pending-review"
  },
  "performanceTracking": {
    "kpis": ["engagement rate", "reach", "clicks"],
    "trackingLinks": "UTM parameters and tracking setup",
    "benchmarks": "Expected performance benchmarks",
    "reportingSchedule": "When to review performance"
  },
  "alternatives": {
    "backupCopy": "Alternative copy if needed",
    "backupImages": "Alternative image options",
    "seasonalVariations": "Seasonal or timely alternatives"
  },
  "recommendations": {
    "improvements": ["suggestion 1", "suggestion 2"],
    "futureContent": "Ideas for follow-up content",
    "optimization": "Post-publication optimization suggestions",
    "scaling": "How to scale this content approach"
  },
  "metadata": {
    "tags": ["tag1", "tag2", "tag3"],
    "category": "content category",
    "difficulty": "easy/medium/hard",
    "estimatedEngagement": "low/medium/high",
    "contentPillars": ["pillar1", "pillar2"],
    "campaignAlignment": "How this aligns with campaign goals"
  }
}`;
}

/**
 * Get prompt template for a specific step
 */
export function getPromptTemplate(step: GenerationStep): string {
  const templates = {
    [GenerationStep.IDEA]: 'Content Idea Generation Template',
    [GenerationStep.COPY_DESIGN]: 'Copy Design Template',
    [GenerationStep.COPY_PUBLICATION]: 'Publication Copy Template',
    [GenerationStep.BASE_IMAGE]: 'Image Generation Template',
    [GenerationStep.FINAL_DESIGN]: 'Final Assembly Template',
  };

  return templates[step] || 'Unknown Template';
}

/**
 * Validate prompt context
 */
export function validatePromptContext(context: PromptContext): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!context.brand.brandName) {
    errors.push('Brand name is required');
  }

  if (!context.campaign.name) {
    errors.push('Campaign name is required');
  }

  if (!context.campaign.platforms || context.campaign.platforms.length === 0) {
    errors.push('At least one platform is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}