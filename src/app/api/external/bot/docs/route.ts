import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://api.postia.com';
  
  const documentation = {
    title: 'Postia Bot Integration API',
    version: '1.0.0',
    description: 'External API for WhatsApp bot and other integrations to trigger content generation',
    baseUrl,
    authentication: {
      type: 'Bearer Token',
      description: 'Use your API key in the Authorization header',
      example: 'Authorization: Bearer pk_your_api_key_here',
      note: 'API keys can be generated from your Postia dashboard under Client Settings > API Keys',
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/external/bot/client',
        description: 'Get client information and current status',
        authentication: 'Required',
        permissions: ['client:read'],
        parameters: [],
        response: {
          success: true,
          data: {
            client: {
              id: 'string',
              brandName: 'string',
              description: 'string',
              brandColors: ['#color1', '#color2'],
              logoUrl: 'string',
              whatsappNumber: 'string',
            },
            agency: {
              name: 'string',
              tokenBalance: 'number',
              subscriptionPlan: 'string',
            },
            socialMedia: {
              links: [
                {
                  platform: 'string',
                  url: 'string',
                  username: 'string',
                }
              ],
              connectedAccounts: [
                {
                  platform: 'string',
                  accountName: 'string',
                }
              ],
            },
            activeCampaigns: [
              {
                id: 'string',
                name: 'string',
                objective: 'string',
                brandTone: 'string',
              }
            ],
            statistics: {
              period: '30 days',
              totalJobs: 'number',
              completedJobs: 'number',
              tokensConsumed: 'number',
              successRate: 'number',
            },
          },
        },
      },
      {
        method: 'POST',
        path: '/api/external/bot/generate',
        description: 'Create a new content generation job',
        authentication: 'Required',
        permissions: ['content:generate'],
        parameters: [
          {
            name: 'prompt',
            type: 'string',
            required: true,
            description: 'The content prompt or idea (max 2000 characters)',
            example: 'Create a social media post about our new product launch',
          },
          {
            name: 'contentType',
            type: 'string',
            required: false,
            default: 'social_post',
            description: 'Type of content to generate',
            options: ['social_post', 'story', 'carousel', 'video_script'],
          },
          {
            name: 'platforms',
            type: 'array',
            required: false,
            default: ['instagram'],
            description: 'Target social media platforms',
            options: ['instagram', 'facebook', 'linkedin', 'twitter'],
          },
          {
            name: 'includeImages',
            type: 'boolean',
            required: false,
            default: true,
            description: 'Whether to generate images along with text content',
          },
          {
            name: 'urgency',
            type: 'string',
            required: false,
            default: 'normal',
            description: 'Processing priority',
            options: ['low', 'normal', 'high'],
          },
          {
            name: 'metadata',
            type: 'object',
            required: false,
            description: 'Additional metadata for the job',
            example: { source: 'whatsapp', userId: 'user123' },
          },
        ],
        response: {
          success: true,
          data: {
            jobId: 'string',
            status: 'accepted',
            estimatedTokens: 'number',
            estimatedCompletionTime: 'string',
            message: 'Content generation job created successfully',
          },
        },
        errors: [
          { code: 401, message: 'Invalid or missing API key' },
          { code: 402, message: 'Insufficient token balance' },
          { code: 400, message: 'Invalid request parameters' },
        ],
      },
      {
        method: 'GET',
        path: '/api/external/bot/jobs/{jobId}',
        description: 'Get status and results of a specific job',
        authentication: 'Required',
        permissions: ['content:read'],
        parameters: [
          {
            name: 'jobId',
            type: 'string',
            required: true,
            description: 'The job ID returned from the generate endpoint',
            location: 'path',
          },
        ],
        response: {
          success: true,
          data: {
            jobId: 'string',
            status: 'completed | pending | in_progress | failed',
            tokensConsumed: 'number',
            createdAt: 'string (ISO date)',
            completedAt: 'string (ISO date) | null',
            progress: {
              percentage: 'number (0-100)',
              currentStep: 'string | null',
            },
            steps: [
              {
                step: 'idea | copy_design | copy_publication | base_image | final_design',
                status: 'completed | pending | in_progress | failed',
                executedAt: 'string (ISO date)',
                error: 'string | null',
              }
            ],
            content: {
              finalImageUrl: 'string | null',
              embeddedText: 'string | null',
              publicationText: 'string | null',
              hashtags: ['string'],
              cta: 'string | null',
              status: 'draft | approved | published',
            },
          },
        },
      },
      {
        method: 'GET',
        path: '/api/external/bot/jobs',
        description: 'List recent content generation jobs',
        authentication: 'Required',
        permissions: ['content:read'],
        parameters: [
          {
            name: 'limit',
            type: 'number',
            required: false,
            default: 10,
            description: 'Number of jobs to return (max 50)',
            location: 'query',
          },
          {
            name: 'offset',
            type: 'number',
            required: false,
            default: 0,
            description: 'Number of jobs to skip for pagination',
            location: 'query',
          },
          {
            name: 'status',
            type: 'string',
            required: false,
            description: 'Filter by job status',
            options: ['pending', 'in_progress', 'completed', 'failed'],
            location: 'query',
          },
        ],
        response: {
          success: true,
          data: {
            jobs: [
              {
                jobId: 'string',
                status: 'string',
                tokensConsumed: 'number',
                createdAt: 'string (ISO date)',
                completedAt: 'string (ISO date) | null',
                progress: {
                  percentage: 'number',
                  completedSteps: 'number',
                  totalSteps: 'number',
                },
                prompt: 'string',
                contentType: 'string',
                platforms: ['string'],
                includeImages: 'boolean',
                hasContent: 'boolean',
              }
            ],
            pagination: {
              limit: 'number',
              offset: 'number',
              total: 'number',
              hasMore: 'boolean',
            },
          },
        },
      },
    ],
    errorCodes: {
      400: 'Bad Request - Invalid parameters or request format',
      401: 'Unauthorized - Invalid or missing API key',
      402: 'Payment Required - Insufficient token balance',
      403: 'Forbidden - API key lacks required permissions',
      404: 'Not Found - Resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error occurred',
    },
    rateLimits: {
      generate: '10 requests per minute',
      status: '60 requests per minute',
      list: '30 requests per minute',
      client: '20 requests per minute',
    },
    webhooks: {
      description: 'Optional webhooks for job completion notifications',
      note: 'Contact support to configure webhooks for your integration',
      events: ['job.completed', 'job.failed', 'token.low_balance'],
    },
    examples: {
      curl: {
        generate: `curl -X POST "${baseUrl}/api/external/bot/generate" \\
  -H "Authorization: Bearer pk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a post about our summer sale",
    "contentType": "social_post",
    "platforms": ["instagram", "facebook"],
    "includeImages": true,
    "urgency": "normal"
  }'`,
        status: `curl -X GET "${baseUrl}/api/external/bot/jobs/job_123456" \\
  -H "Authorization: Bearer pk_your_api_key"`,
        client: `curl -X GET "${baseUrl}/api/external/bot/client" \\
  -H "Authorization: Bearer pk_your_api_key"`,
      },
      javascript: {
        generate: `const response = await fetch('${baseUrl}/api/external/bot/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer pk_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Create a post about our summer sale',
    contentType: 'social_post',
    platforms: ['instagram', 'facebook'],
    includeImages: true,
    urgency: 'normal'
  })
});

const result = await response.json();
console.log(result);`,
      },
      python: {
        generate: `import requests

url = '${baseUrl}/api/external/bot/generate'
headers = {
    'Authorization': 'Bearer pk_your_api_key',
    'Content-Type': 'application/json'
}
data = {
    'prompt': 'Create a post about our summer sale',
    'contentType': 'social_post',
    'platforms': ['instagram', 'facebook'],
    'includeImages': True,
    'urgency': 'normal'
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`,
      },
    },
    sdks: {
      note: 'Official SDKs coming soon',
      community: 'Community SDKs available on GitHub',
    },
    support: {
      documentation: `${baseUrl}/docs`,
      email: 'api-support@postia.com',
      discord: 'https://discord.gg/postia',
    },
  };

  return NextResponse.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}