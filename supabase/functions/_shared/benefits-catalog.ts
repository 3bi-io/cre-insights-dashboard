/**
 * Benefits Catalog Helper for Edge Functions
 * Queries the benefits_catalog table for keywords and social copy
 */

import { getServiceClient } from './supabase-client.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('benefits-catalog');

export interface BenefitCatalogEntry {
  id: string;
  label: string;
  category: string;
  icon: string;
  keywords: string[];
  social_copy: Record<string, string>;
  sort_order: number;
}

let cachedBenefits: BenefitCatalogEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active benefits from the catalog (with in-memory cache)
 */
export async function getBenefitsCatalog(): Promise<BenefitCatalogEntry[]> {
  const now = Date.now();
  if (cachedBenefits && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedBenefits;
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('benefits_catalog')
      .select('id, label, category, icon, keywords, social_copy, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      logger.error('Failed to fetch benefits catalog', { error: error.message });
      return cachedBenefits || [];
    }

    cachedBenefits = data as BenefitCatalogEntry[];
    cacheTimestamp = now;
    return cachedBenefits;
  } catch (err) {
    logger.error('Benefits catalog fetch error', { error: (err as Error).message });
    return cachedBenefits || [];
  }
}

/**
 * Get all benefits keywords as a flat array (for classifier matching)
 */
export async function getBenefitsKeywords(): Promise<string[]> {
  const catalog = await getBenefitsCatalog();
  return catalog.flatMap(b => b.keywords);
}

/**
 * Get social copy for a specific platform from all benefits
 */
export async function getBenefitsSocialCopy(platform: string): Promise<string> {
  const catalog = await getBenefitsCatalog();
  const copies = catalog
    .map(b => b.social_copy?.[platform])
    .filter(Boolean);
  
  if (copies.length === 0) {
    return 'We offer competitive benefits including health insurance, 401(k), and paid time off.';
  }
  
  // Return a combined summary of key benefits (first 4)
  return copies.slice(0, 4).join(' ');
}

/**
 * Match a message against benefit keywords and return matching benefit labels
 */
export async function matchBenefitsInContent(content: string): Promise<string[]> {
  const catalog = await getBenefitsCatalog();
  const lowerContent = content.toLowerCase();
  
  return catalog
    .filter(b => b.keywords.some(kw => lowerContent.includes(kw)))
    .map(b => b.label);
}

/**
 * Get benefits for a specific job listing
 */
export async function getJobBenefits(jobId: string): Promise<BenefitCatalogEntry[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('job_listing_benefits')
    .select('benefit_id, custom_value, benefits_catalog(*)')
    .eq('job_id', jobId);

  if (error || !data) return [];
  
  return data.map((row: any) => ({
    ...row.benefits_catalog,
    label: row.custom_value || row.benefits_catalog.label,
  }));
}
