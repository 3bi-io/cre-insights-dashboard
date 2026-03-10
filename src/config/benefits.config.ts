/**
 * Centralized Benefits Configuration
 * Single source of truth for all benefit types across the platform.
 * Consumers: Ad Creative Studio, social responders, classifiers, voice agents.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============= Types =============

export interface BenefitItem {
  id: string;
  label: string;
  category: string;
  icon: string;
  keywords: string[];
  socialCopy: Record<string, string>;
  sortOrder: number;
  isActive: boolean;
}

export type BenefitId = string;

export interface JobBenefit {
  benefitId: string;
  customValue?: string | null;
}

// ============= Static Fallback =============
// Used when DB is unavailable or for SSR. Matches seed data.

export const BENEFITS_FALLBACK: BenefitItem[] = [
  { id: 'sign_on_bonus', label: '$5k Sign-on Bonus', category: 'compensation', icon: 'DollarSign', keywords: ['sign on', 'signing bonus', 'sign-on'], socialCopy: {}, sortOrder: 1, isActive: true },
  { id: 'home_weekly', label: 'Home Weekly', category: 'lifestyle', icon: 'Home', keywords: ['home weekly', 'home time'], socialCopy: {}, sortOrder: 2, isActive: true },
  { id: 'new_equipment', label: 'New Equipment', category: 'operations', icon: 'Truck', keywords: ['new equipment', 'new trucks'], socialCopy: {}, sortOrder: 3, isActive: true },
  { id: 'health_insurance', label: 'Health Insurance', category: 'insurance', icon: 'HeartPulse', keywords: ['health insurance', 'medical'], socialCopy: {}, sortOrder: 4, isActive: true },
  { id: 'dental_insurance', label: 'Dental Insurance', category: 'insurance', icon: 'Smile', keywords: ['dental', 'dental insurance'], socialCopy: {}, sortOrder: 5, isActive: true },
  { id: 'vision_insurance', label: 'Vision Insurance', category: 'insurance', icon: 'Eye', keywords: ['vision', 'vision insurance'], socialCopy: {}, sortOrder: 6, isActive: true },
  { id: 'retirement_401k', label: '401(k) Retirement', category: 'retirement', icon: 'PiggyBank', keywords: ['401k', '401(k)', 'retirement'], socialCopy: {}, sortOrder: 7, isActive: true },
  { id: 'paid_time_off', label: 'Paid Time Off', category: 'lifestyle', icon: 'Calendar', keywords: ['pto', 'paid time off', 'vacation'], socialCopy: {}, sortOrder: 8, isActive: true },
  { id: 'full_benefits', label: 'Full Benefits Package', category: 'insurance', icon: 'Heart', keywords: ['full benefits', 'benefits package'], socialCopy: {}, sortOrder: 9, isActive: true },
  { id: 'pet_friendly', label: 'Pet Friendly', category: 'lifestyle', icon: 'PawPrint', keywords: ['pet friendly', 'pet policy'], socialCopy: {}, sortOrder: 10, isActive: true },
  { id: 'no_touch_freight', label: 'No Touch Freight', category: 'operations', icon: 'Package', keywords: ['no touch', 'no touch freight'], socialCopy: {}, sortOrder: 11, isActive: true },
  { id: 'paid_orientation', label: 'Paid Orientation', category: 'compensation', icon: 'GraduationCap', keywords: ['paid orientation'], socialCopy: {}, sortOrder: 12, isActive: true },
  { id: 'safety_bonuses', label: 'Safety Bonuses', category: 'compensation', icon: 'Shield', keywords: ['safety bonus', 'safety bonuses'], socialCopy: {}, sortOrder: 13, isActive: true },
  { id: 'rider_policy', label: 'Rider Policy', category: 'lifestyle', icon: 'Users', keywords: ['rider policy'], socialCopy: {}, sortOrder: 14, isActive: true },
  { id: 'direct_deposit', label: 'Direct Deposit', category: 'compensation', icon: 'Wallet', keywords: ['direct deposit', 'weekly pay'], socialCopy: {}, sortOrder: 15, isActive: true },
  { id: 'referral_bonus', label: 'Referral Bonus', category: 'compensation', icon: 'Gift', keywords: ['referral bonus', 'refer a driver'], socialCopy: {}, sortOrder: 16, isActive: true },
];

// ============= React Query Hook =============

function mapRowToBenefit(row: any): BenefitItem {
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    icon: row.icon,
    keywords: row.keywords || [],
    socialCopy: row.social_copy || {},
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function useBenefitsCatalog() {
  return useQuery({
    queryKey: ['benefits-catalog'],
    queryFn: async (): Promise<BenefitItem[]> => {
      const { data, error } = await (supabase as any)
        .from('benefits_catalog')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapRowToBenefit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: BENEFITS_FALLBACK,
  });
}

/**
 * Fetch benefits for a specific job listing
 */
export function useJobBenefits(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-benefits', jobId],
    queryFn: async (): Promise<(BenefitItem & { customValue?: string })[]> => {
      if (!jobId) return [];

      const { data, error } = await (supabase as any)
        .from('job_listing_benefits')
        .select('benefit_id, custom_value, benefits_catalog(*)')
        .eq('job_id', jobId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...mapRowToBenefit(row.benefits_catalog),
        customValue: row.custom_value,
      }));
    },
    enabled: !!jobId,
  });
}

/**
 * Convert benefit items to a readable string for voice agents
 */
export function benefitsToVoiceContext(benefits: BenefitItem[]): string {
  if (!benefits.length) return 'competitive benefits package';
  return benefits.map(b => b.label).join(', ');
}

/**
 * Re-export for backward compatibility with Ad Creative Studio
 */
export const BENEFIT_OPTIONS = BENEFITS_FALLBACK.map(b => ({
  id: b.id,
  label: b.label,
  icon: b.icon,
}));
