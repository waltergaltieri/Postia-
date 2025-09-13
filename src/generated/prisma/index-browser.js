
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AgencyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  subscriptionPlan: 'subscriptionPlan',
  tokenBalance: 'tokenBalance',
  stripeCustomerId: 'stripeCustomerId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  emailVerified: 'emailVerified',
  emailVerificationToken: 'emailVerificationToken',
  passwordResetToken: 'passwordResetToken',
  passwordResetExpires: 'passwordResetExpires',
  agencyId: 'agencyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserInvitationScalarFieldEnum = {
  id: 'id',
  email: 'email',
  role: 'role',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  senderId: 'senderId',
  agencyId: 'agencyId',
  clientIds: 'clientIds',
  createdAt: 'createdAt'
};

exports.Prisma.ClientScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  brandName: 'brandName',
  brandColors: 'brandColors',
  typography: 'typography',
  description: 'description',
  logoUrl: 'logoUrl',
  whatsappNumber: 'whatsappNumber',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SocialMediaLinkScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  platform: 'platform',
  url: 'url',
  username: 'username'
};

exports.Prisma.BrandAssetScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  type: 'type',
  name: 'name',
  url: 'url',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  name: 'name',
  objective: 'objective',
  startDate: 'startDate',
  endDate: 'endDate',
  brandTone: 'brandTone',
  publicationFrequency: 'publicationFrequency',
  templateIds: 'templateIds',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  scheduledDate: 'scheduledDate',
  status: 'status',
  finalImageUrl: 'finalImageUrl',
  embeddedText: 'embeddedText',
  publicationText: 'publicationText',
  hashtags: 'hashtags',
  cta: 'cta',
  generationJobId: 'generationJobId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContentGenerationJobScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  status: 'status',
  tokensConsumed: 'tokensConsumed',
  brandContext: 'brandContext',
  createdAt: 'createdAt',
  completedAt: 'completedAt'
};

exports.Prisma.GenerationStepResultScalarFieldEnum = {
  id: 'id',
  jobId: 'jobId',
  step: 'step',
  status: 'status',
  input: 'input',
  output: 'output',
  tokensUsed: 'tokensUsed',
  executedAt: 'executedAt',
  error: 'error'
};

exports.Prisma.ContentVersionScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  versionNumber: 'versionNumber',
  finalImageUrl: 'finalImageUrl',
  embeddedText: 'embeddedText',
  publicationText: 'publicationText',
  hashtags: 'hashtags',
  cta: 'cta',
  createdAt: 'createdAt'
};

exports.Prisma.SocialAccountScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  platform: 'platform',
  accountId: 'accountId',
  accountName: 'accountName',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  expiresAt: 'expiresAt',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PublicationResultScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  socialAccountId: 'socialAccountId',
  platformPostId: 'platformPostId',
  status: 'status',
  publishedAt: 'publishedAt',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.TokenTransactionScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  userId: 'userId',
  amount: 'amount',
  type: 'type',
  description: 'description',
  reference: 'reference',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  details: 'details',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  keyPrefix: 'keyPrefix',
  hashedKey: 'hashedKey',
  clientId: 'clientId',
  permissions: 'permissions',
  isActive: 'isActive',
  lastUsedAt: 'lastUsedAt',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiKeyUsageScalarFieldEnum = {
  id: 'id',
  apiKeyId: 'apiKeyId',
  endpoint: 'endpoint',
  method: 'method',
  statusCode: 'statusCode',
  tokensConsumed: 'tokensConsumed',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  requestBody: 'requestBody',
  responseTime: 'responseTime',
  createdAt: 'createdAt'
};

exports.Prisma.SystemLogScalarFieldEnum = {
  id: 'id',
  level: 'level',
  message: 'message',
  context: 'context',
  error: 'error',
  timestamp: 'timestamp'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.SubscriptionPlan = exports.$Enums.SubscriptionPlan = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  CUSTOM: 'CUSTOM'
};

exports.UserRole = exports.$Enums.UserRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  COLLABORATOR: 'COLLABORATOR'
};

exports.AssetType = exports.$Enums.AssetType = {
  LOGO: 'LOGO',
  IMAGE: 'IMAGE',
  TEMPLATE: 'TEMPLATE',
  PALETTE: 'PALETTE'
};

exports.CampaignStatus = exports.$Enums.CampaignStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

exports.PostStatus = exports.$Enums.PostStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED'
};

exports.JobStatus = exports.$Enums.JobStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.GenerationStep = exports.$Enums.GenerationStep = {
  IDEA: 'IDEA',
  COPY_DESIGN: 'COPY_DESIGN',
  COPY_PUBLICATION: 'COPY_PUBLICATION',
  BASE_IMAGE: 'BASE_IMAGE',
  FINAL_DESIGN: 'FINAL_DESIGN'
};

exports.StepStatus = exports.$Enums.StepStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.SocialPlatform = exports.$Enums.SocialPlatform = {
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  LINKEDIN: 'LINKEDIN'
};

exports.PublicationStatus = exports.$Enums.PublicationStatus = {
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED'
};

exports.TokenTransactionType = exports.$Enums.TokenTransactionType = {
  CONSUMPTION: 'CONSUMPTION',
  PURCHASE: 'PURCHASE',
  SUBSCRIPTION_RENEWAL: 'SUBSCRIPTION_RENEWAL',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT'
};

exports.Prisma.ModelName = {
  Agency: 'Agency',
  User: 'User',
  UserInvitation: 'UserInvitation',
  Client: 'Client',
  SocialMediaLink: 'SocialMediaLink',
  BrandAsset: 'BrandAsset',
  Campaign: 'Campaign',
  Post: 'Post',
  ContentGenerationJob: 'ContentGenerationJob',
  GenerationStepResult: 'GenerationStepResult',
  ContentVersion: 'ContentVersion',
  SocialAccount: 'SocialAccount',
  PublicationResult: 'PublicationResult',
  TokenTransaction: 'TokenTransaction',
  AuditLog: 'AuditLog',
  ApiKey: 'ApiKey',
  ApiKeyUsage: 'ApiKeyUsage',
  SystemLog: 'SystemLog',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
