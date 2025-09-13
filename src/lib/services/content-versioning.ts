import { db } from '@/lib/db';
import { GenerationStep } from '@/generated/prisma';

export interface ContentVersion {
  id: string;
  jobId: string;
  step: GenerationStep;
  version: number;
  content: any;
  metadata: {
    generatedAt: string;
    userId: string;
    prompt?: string;
    model?: string;
    usage?: {
      tokens: number;
      cost: number;
    };
    parentVersionId?: string;
    isRegeneration: boolean;
    regenerationReason?: string;
  };
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
}

export interface VersionHistory {
  step: GenerationStep;
  versions: ContentVersion[];
  currentVersion: ContentVersion;
  totalVersions: number;
}

export interface ContentComparison {
  step: GenerationStep;
  version1: ContentVersion;
  version2: ContentVersion;
  differences: {
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'removed' | 'modified';
  }[];
  similarity: number; // 0-1 score
}

/**
 * Create a new content version
 */
export async function createContentVersion(
  jobId: string,
  step: GenerationStep,
  content: any,
  metadata: {
    userId: string;
    prompt?: string;
    model?: string;
    usage?: { tokens: number; cost: number };
    parentVersionId?: string;
    isRegeneration?: boolean;
    regenerationReason?: string;
  }
): Promise<ContentVersion> {
  // Get the next version number for this step
  const existingVersions = await db.contentVersion.findMany({
    where: { jobId, step },
    orderBy: { version: 'desc' },
    take: 1,
  });

  const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

  // Create the new version
  const version = await db.contentVersion.create({
    data: {
      jobId,
      step,
      version: nextVersion,
      content,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: metadata.userId,
        prompt: metadata.prompt,
        model: metadata.model,
        usage: metadata.usage,
        parentVersionId: metadata.parentVersionId,
        isRegeneration: metadata.isRegeneration || false,
        regenerationReason: metadata.regenerationReason,
      },
      status: 'active',
    },
  });

  // Archive previous active version if this is not a regeneration
  if (!metadata.isRegeneration) {
    await db.contentVersion.updateMany({
      where: {
        jobId,
        step,
        status: 'active',
        id: { not: version.id },
      },
      data: { status: 'archived' },
    });
  }

  return {
    id: version.id,
    jobId: version.jobId,
    step: version.step,
    version: version.version,
    content: version.content,
    metadata: version.metadata as any,
    status: version.status as any,
    createdAt: version.createdAt.toISOString(),
  };
}

/**
 * Get version history for a specific step
 */
export async function getStepVersionHistory(
  jobId: string,
  step: GenerationStep
): Promise<VersionHistory | null> {
  const versions = await db.contentVersion.findMany({
    where: { jobId, step },
    orderBy: { version: 'desc' },
  });

  if (versions.length === 0) {
    return null;
  }

  const currentVersion = versions.find(v => v.status === 'active') || versions[0];

  return {
    step,
    versions: versions.map(v => ({
      id: v.id,
      jobId: v.jobId,
      step: v.step,
      version: v.version,
      content: v.content,
      metadata: v.metadata as any,
      status: v.status as any,
      createdAt: v.createdAt.toISOString(),
    })),
    currentVersion: {
      id: currentVersion.id,
      jobId: currentVersion.jobId,
      step: currentVersion.step,
      version: currentVersion.version,
      content: currentVersion.content,
      metadata: currentVersion.metadata as any,
      status: currentVersion.status as any,
      createdAt: currentVersion.createdAt.toISOString(),
    },
    totalVersions: versions.length,
  };
}

/**
 * Get complete version history for a job
 */
export async function getJobVersionHistory(jobId: string): Promise<Record<GenerationStep, VersionHistory>> {
  const allVersions = await db.contentVersion.findMany({
    where: { jobId },
    orderBy: [{ step: 'asc' }, { version: 'desc' }],
  });

  const historyByStep: Record<string, VersionHistory> = {};

  // Group versions by step
  const versionsByStep = allVersions.reduce((acc, version) => {
    if (!acc[version.step]) {
      acc[version.step] = [];
    }
    acc[version.step].push(version);
    return acc;
  }, {} as Record<string, any[]>);

  // Build history for each step
  Object.entries(versionsByStep).forEach(([step, versions]) => {
    const currentVersion = versions.find(v => v.status === 'active') || versions[0];
    
    historyByStep[step] = {
      step: step as GenerationStep,
      versions: versions.map(v => ({
        id: v.id,
        jobId: v.jobId,
        step: v.step,
        version: v.version,
        content: v.content,
        metadata: v.metadata as any,
        status: v.status as any,
        createdAt: v.createdAt.toISOString(),
      })),
      currentVersion: {
        id: currentVersion.id,
        jobId: currentVersion.jobId,
        step: currentVersion.step,
        version: currentVersion.version,
        content: currentVersion.content,
        metadata: currentVersion.metadata as any,
        status: currentVersion.status as any,
        createdAt: currentVersion.createdAt.toISOString(),
      },
      totalVersions: versions.length,
    };
  });

  return historyByStep as Record<GenerationStep, VersionHistory>;
}

/**
 * Activate a specific version
 */
export async function activateVersion(versionId: string, userId: string): Promise<ContentVersion> {
  const version = await db.contentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error('Version not found');
  }

  // Archive current active version
  await db.contentVersion.updateMany({
    where: {
      jobId: version.jobId,
      step: version.step,
      status: 'active',
    },
    data: { status: 'archived' },
  });

  // Activate the selected version
  const updatedVersion = await db.contentVersion.update({
    where: { id: versionId },
    data: { 
      status: 'active',
      metadata: {
        ...(version.metadata as any),
        activatedAt: new Date().toISOString(),
        activatedBy: userId,
      },
    },
  });

  return {
    id: updatedVersion.id,
    jobId: updatedVersion.jobId,
    step: updatedVersion.step,
    version: updatedVersion.version,
    content: updatedVersion.content,
    metadata: updatedVersion.metadata as any,
    status: updatedVersion.status as any,
    createdAt: updatedVersion.createdAt.toISOString(),
  };
}

/**
 * Delete a version (soft delete)
 */
export async function deleteVersion(versionId: string, userId: string): Promise<void> {
  const version = await db.contentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error('Version not found');
  }

  if (version.status === 'active') {
    throw new Error('Cannot delete active version. Please activate another version first.');
  }

  await db.contentVersion.update({
    where: { id: versionId },
    data: { 
      status: 'deleted',
      metadata: {
        ...(version.metadata as any),
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
      },
    },
  });
}

/**
 * Compare two versions
 */
export async function compareVersions(
  version1Id: string,
  version2Id: string
): Promise<ContentComparison> {
  const [version1, version2] = await Promise.all([
    db.contentVersion.findUnique({ where: { id: version1Id } }),
    db.contentVersion.findUnique({ where: { id: version2Id } }),
  ]);

  if (!version1 || !version2) {
    throw new Error('One or both versions not found');
  }

  if (version1.step !== version2.step) {
    throw new Error('Cannot compare versions from different steps');
  }

  const differences = findContentDifferences(version1.content, version2.content);
  const similarity = calculateSimilarity(version1.content, version2.content);

  return {
    step: version1.step,
    version1: {
      id: version1.id,
      jobId: version1.jobId,
      step: version1.step,
      version: version1.version,
      content: version1.content,
      metadata: version1.metadata as any,
      status: version1.status as any,
      createdAt: version1.createdAt.toISOString(),
    },
    version2: {
      id: version2.id,
      jobId: version2.jobId,
      step: version2.step,
      version: version2.version,
      content: version2.content,
      metadata: version2.metadata as any,
      status: version2.status as any,
      createdAt: version2.createdAt.toISOString(),
    },
    differences,
    similarity,
  };
}

/**
 * Find differences between two content objects
 */
function findContentDifferences(content1: any, content2: any): Array<{
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}> {
  const differences: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'removed' | 'modified';
  }> = [];

  // Handle different content structures
  if (typeof content1 === 'string' && typeof content2 === 'string') {
    if (content1 !== content2) {
      differences.push({
        field: 'content',
        oldValue: content1,
        newValue: content2,
        changeType: 'modified',
      });
    }
    return differences;
  }

  // Handle object comparison
  const allKeys = new Set([
    ...Object.keys(content1 || {}),
    ...Object.keys(content2 || {}),
  ]);

  allKeys.forEach(key => {
    const value1 = content1?.[key];
    const value2 = content2?.[key];

    if (value1 === undefined && value2 !== undefined) {
      differences.push({
        field: key,
        oldValue: undefined,
        newValue: value2,
        changeType: 'added',
      });
    } else if (value1 !== undefined && value2 === undefined) {
      differences.push({
        field: key,
        oldValue: value1,
        newValue: undefined,
        changeType: 'removed',
      });
    } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
      differences.push({
        field: key,
        oldValue: value1,
        newValue: value2,
        changeType: 'modified',
      });
    }
  });

  return differences;
}

/**
 * Calculate similarity between two content objects
 */
function calculateSimilarity(content1: any, content2: any): number {
  if (typeof content1 === 'string' && typeof content2 === 'string') {
    return calculateStringSimilarity(content1, content2);
  }

  // For objects, calculate field-by-field similarity
  const allKeys = new Set([
    ...Object.keys(content1 || {}),
    ...Object.keys(content2 || {}),
  ]);

  if (allKeys.size === 0) return 1;

  let totalSimilarity = 0;
  let fieldCount = 0;

  allKeys.forEach(key => {
    const value1 = content1?.[key];
    const value2 = content2?.[key];

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      totalSimilarity += calculateStringSimilarity(value1, value2);
    } else if (JSON.stringify(value1) === JSON.stringify(value2)) {
      totalSimilarity += 1;
    } else {
      totalSimilarity += 0;
    }
    fieldCount++;
  });

  return fieldCount > 0 ? totalSimilarity / fieldCount : 0;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen > 0 ? (maxLen - matrix[len2][len1]) / maxLen : 0;
}

/**
 * Get version statistics for a job
 */
export async function getVersionStatistics(jobId: string): Promise<{
  totalVersions: number;
  versionsByStep: Record<GenerationStep, number>;
  regenerationCount: number;
  averageVersionsPerStep: number;
  mostRegenerated: GenerationStep | null;
}> {
  const versions = await db.contentVersion.findMany({
    where: { jobId },
  });

  const versionsByStep: Record<string, number> = {};
  let regenerationCount = 0;

  versions.forEach(version => {
    versionsByStep[version.step] = (versionsByStep[version.step] || 0) + 1;
    
    const metadata = version.metadata as any;
    if (metadata?.isRegeneration) {
      regenerationCount++;
    }
  });

  const stepCounts = Object.values(versionsByStep);
  const averageVersionsPerStep = stepCounts.length > 0 
    ? stepCounts.reduce((sum, count) => sum + count, 0) / stepCounts.length 
    : 0;

  const mostRegenerated = Object.entries(versionsByStep)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as GenerationStep || null;

  return {
    totalVersions: versions.length,
    versionsByStep: versionsByStep as Record<GenerationStep, number>,
    regenerationCount,
    averageVersionsPerStep,
    mostRegenerated,
  };
}

/**
 * Clean up old versions (keep only latest N versions per step)
 */
export async function cleanupOldVersions(
  jobId: string,
  keepVersionsPerStep: number = 5
): Promise<{ deletedCount: number }> {
  const steps = Object.values(GenerationStep);
  let deletedCount = 0;

  for (const step of steps) {
    const versions = await db.contentVersion.findMany({
      where: { jobId, step, status: { not: 'deleted' } },
      orderBy: { version: 'desc' },
    });

    if (versions.length > keepVersionsPerStep) {
      const versionsToDelete = versions.slice(keepVersionsPerStep);
      
      // Don't delete active versions
      const safeToDelete = versionsToDelete.filter(v => v.status !== 'active');
      
      if (safeToDelete.length > 0) {
        await db.contentVersion.updateMany({
          where: {
            id: { in: safeToDelete.map(v => v.id) },
          },
          data: { status: 'deleted' },
        });
        
        deletedCount += safeToDelete.length;
      }
    }
  }

  return { deletedCount };
}