import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Campaign = Database['public']['Tables']['campaigns']['Row'];
type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalApplications: number;
  avgCostPerLead: number;
}

export const campaignsService = {
  /**
   * Fetch all campaigns for the current user
   */
  async fetchCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Campaign[];
  },

  /**
   * Fetch a single campaign by ID
   */
  async fetchCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  /**
   * Create a new campaign
   */
  async createCampaign(campaign: Omit<CampaignInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, updates: CampaignUpdate) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Fetch campaign statistics
   */
  async fetchCampaignStats(): Promise<CampaignStats> {
    // Fetch campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) throw campaignsError;

    const totalCampaigns = campaigns?.length || 0;
    const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;

    // For now, return placeholder values for applications and cost per lead
    // These would need to be calculated from analytics tables in production
    return {
      totalCampaigns,
      activeCampaigns,
      totalApplications: 0,
      avgCostPerLead: 0,
    };
  },

  /**
   * Fetch job assignments for a campaign
   */
  async fetchCampaignJobAssignments(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_job_assignments')
      .select(`
        *,
        job_listings:job_listing_id (
          id,
          title,
          status
        )
      `)
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return data;
  },

  /**
   * Assign jobs to a campaign
   */
  async assignJobsToCampaign(campaignId: string, jobListingIds: string[]) {
    const assignments = jobListingIds.map(jobListingId => ({
      campaign_id: campaignId,
      job_listing_id: jobListingId,
    }));

    const { data, error } = await supabase
      .from('campaign_job_assignments')
      .insert(assignments)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Remove job assignment from campaign
   */
  async removeJobFromCampaign(campaignId: string, jobListingId: string) {
    const { error } = await supabase
      .from('campaign_job_assignments')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('job_listing_id', jobListingId);

    if (error) throw error;
  },
};
