import { supabase } from '@/integrations/supabase/client';
import crypto from 'crypto';

export interface CacheEntry {
  cache_key: string;
  analysis_result: any;
  provider: string;
  confidence_score?: number;
  processing_type: string;
  expires_at: string;
}

class CacheService {
  private generateCacheKey(data: any, provider: string, settings: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({ data, provider, settings }));
    return hash.digest('hex');
  }

  async get(cacheKey: string): Promise<any | null> {
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
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(
    data: any,
    result: any,
    provider: string,
    settings: any,
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
        .upsert({
          cache_key: cacheKey,
          analysis_result: result,
          provider,
          confidence_score: confidenceScore,
          processing_type: processingType,
          expires_at: expiresAt.toISOString(),
        });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  getCacheKey(data: any, provider: string, settings: any): string {
    return this.generateCacheKey(data, provider, settings);
  }

  async cleanup(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_cache');
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      await supabase
        .from('ai_analysis_cache')
        .delete()
        .like('cache_key', `%${pattern}%`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

export const cacheService = new CacheService();