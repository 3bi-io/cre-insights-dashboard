/**
 * Platform-specific character limits and validation utilities
 */

export interface PlatformLimit {
  platform: string;
  headlineLimit: number;
  bodyLimit: number;
  hashtagLimit: number;
  recommendedImageSize: { width: number; height: number };
  aspectRatios: string[];
  supportsVideo: boolean;
}

export const PLATFORM_LIMITS: Record<string, PlatformLimit> = {
  x: {
    platform: 'x',
    headlineLimit: 60,
    bodyLimit: 280,
    hashtagLimit: 5,
    recommendedImageSize: { width: 1200, height: 675 },
    aspectRatios: ['16:9', '1:1'],
    supportsVideo: true,
  },
  facebook: {
    platform: 'facebook',
    headlineLimit: 100,
    bodyLimit: 63206,
    hashtagLimit: 30,
    recommendedImageSize: { width: 1200, height: 630 },
    aspectRatios: ['16:9', '1:1', '4:5'],
    supportsVideo: true,
  },
  instagram: {
    platform: 'instagram',
    headlineLimit: 100,
    bodyLimit: 2200,
    hashtagLimit: 30,
    recommendedImageSize: { width: 1080, height: 1080 },
    aspectRatios: ['1:1', '4:5', '9:16'],
    supportsVideo: true,
  },
  linkedin: {
    platform: 'linkedin',
    headlineLimit: 200,
    bodyLimit: 3000,
    hashtagLimit: 5,
    recommendedImageSize: { width: 1200, height: 627 },
    aspectRatios: ['16:9', '1:1'],
    supportsVideo: true,
  },
  tiktok: {
    platform: 'tiktok',
    headlineLimit: 100,
    bodyLimit: 2200,
    hashtagLimit: 10,
    recommendedImageSize: { width: 1080, height: 1920 },
    aspectRatios: ['9:16'],
    supportsVideo: true,
  },
  reddit: {
    platform: 'reddit',
    headlineLimit: 300,
    bodyLimit: 40000,
    hashtagLimit: 0,
    recommendedImageSize: { width: 1200, height: 628 },
    aspectRatios: ['16:9', '4:3'],
    supportsVideo: true,
  },
};

export function getPlatformLimit(platform: string): PlatformLimit | undefined {
  return PLATFORM_LIMITS[platform];
}

export function validateContent(
  platform: string,
  headline: string,
  body: string,
  hashtags: string[]
): { valid: boolean; warnings: string[] } {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) {
    return { valid: true, warnings: [] };
  }

  const warnings: string[] = [];

  if (headline.length > limits.headlineLimit) {
    warnings.push(`Headline exceeds ${limits.headlineLimit} character limit for ${platform} (${headline.length}/${limits.headlineLimit})`);
  }

  if (body.length > limits.bodyLimit) {
    warnings.push(`Body exceeds ${limits.bodyLimit} character limit for ${platform} (${body.length}/${limits.bodyLimit})`);
  }

  if (hashtags.length > limits.hashtagLimit) {
    warnings.push(`Too many hashtags for ${platform} (${hashtags.length}/${limits.hashtagLimit})`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export function getCharacterCount(text: string, limit: number): { count: number; remaining: number; exceeded: boolean } {
  const count = text.length;
  const remaining = limit - count;
  return {
    count,
    remaining,
    exceeded: remaining < 0,
  };
}

export function formatCharacterCount(current: number, max: number): string {
  return `${current.toLocaleString()}/${max.toLocaleString()}`;
}
