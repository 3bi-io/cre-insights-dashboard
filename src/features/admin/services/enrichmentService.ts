import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface EnrichmentCandidate {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  source: string | null;
  missingFields: string[];
  enrichment_status: string | null;
}

/**
 * Service for data enrichment operations
 */
export class EnrichmentService {
  /**
   * Get applications from a given source that are missing specific critical fields
   * and haven't already been enriched
   */
  static async getEnrichmentCandidates(
    source: string,
    missingFieldNames: string[],
    limit: number = 50
  ): Promise<EnrichmentCandidate[]> {
    logger.debug('EnrichmentService: Finding candidates', { source, missingFieldNames, limit });

    const { data, error } = await supabase
      .from('applications')
      .select('id, first_name, last_name, phone, source, enrichment_status, cdl_class, driving_experience_years, city, state, zip, applicant_email, exp')
      .eq('source', source)
      .is('enrichment_status', null)
      .not('phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('EnrichmentService: Error fetching candidates', { error });
      throw error;
    }

    // Filter to only apps that are actually missing the specified fields
    return (data || [])
      .map(app => {
        const missing = missingFieldNames.filter(field => {
          const value = (app as Record<string, unknown>)[field];
          return value === null || value === undefined || value === '' || value === 'N/A';
        });
        return { ...app, missingFields: missing } as EnrichmentCandidate;
      })
      .filter(app => app.missingFields.length > 0);
  }

  /**
   * Mark applications as pending enrichment
   */
  static async markForEnrichment(applicationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('applications')
      .update({ enrichment_status: 'pending' } as any)
      .in('id', applicationIds);

    if (error) {
      logger.error('EnrichmentService: Error marking for enrichment', { error });
      throw error;
    }
  }
}
