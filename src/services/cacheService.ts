import { supabase } from '@/integrations/supabase/client';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export interface CacheEntry {
  cache_key: string;
  analysis_result: unknown;
  provider: string;
  confidence_score?: number;
  processing_type: string;
  expires_at: string;
}

class CacheService {
  private generateCacheKey(data: unknown, provider: string, settings: unknown): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({ data, provider, settings }));
    return hash.digest('hex');
  }

  async get(cacheKey: string): Promise<unknown | null> {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) return null;
      return data.analysis_result;
    } catch (error) {
      logger.error('Cache get error', error, 'Cache');
      return null;
    }
  }

  async set(
    data: unknown,
    result: unknown,
    provider: string,
    settings: unknown,
    ttlHours: number = 24,
    processingType: string = 'ai',
    confidenceScore?: number
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(data, provider, settings);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      await supabase
        .from('ai_analysis_cache')
        .upsert([{
          cache_key: cacheKey,
          analysis_result: JSON.parse(JSON.stringify(result)),
          provider,
          confidence_score: confidenceScore,
          processing_type: processingType,
          expires_at: expiresAt.toISOString(),
        }]);
    } catch (error) {
      logger.error('Cache set error', error, 'Cache');
    }
  }

  getCacheKey(data: unknown, provider: string, settings: unknown): string {
    return this.generateCacheKey(data, provider, settings);
  }

  async cleanup(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_cache');
    } catch (error) {
      logger.error('Cache cleanup error', error, 'Cache');
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      await supabase
        .from('ai_analysis_cache')
        .delete()
        .like('cache_key', `%${pattern}%`);
    } catch (error) {
      logger.error('Cache invalidation error', error, 'Cache');
    }
  }
}

export const cacheService = new CacheService();
