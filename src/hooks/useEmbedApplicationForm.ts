import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { normalizePhoneNumber } from '@/utils/phoneNormalizer';
import { useFormPersistence } from '@/hooks/useFormPersistence';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  over21: string;
  cdl: string;
  experience: string;
  drug: string;
  veteran: string;
  consent: string;
  privacy: string;
  // URL tracking parameters
  ad_id: string;
  campaign_id: string;
  adset_id: string;
  job_listing_id: string;
  job_id: string;
  org_slug: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referral_source: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
  over21: '',
  cdl: '',
  experience: '',
  drug: '',
  veteran: '',
  consent: '',
  privacy: '',
  // URL tracking parameters
  ad_id: '',
  campaign_id: '',
  adset_id: '',
  job_listing_id: '',
  job_id: '',
  org_slug: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  referral_source: '',
};

interface SubmitResponse {
  message: string;
  applicationId: string;
  organizationName?: string;
  hasVoiceAgent?: boolean;
}

interface UseEmbedApplicationFormOptions {
  onSuccess?: (data: SubmitResponse) => void;
}

/**
 * Specialized hook for embed form submissions
 * Automatically sets source to 'Embed Form' for outbound voice agent routing
 */
export const useEmbedApplicationForm = (options?: UseEmbedApplicationFormOptions) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchParams] = useSearchParams();

  // Form persistence for auto-save
  const {
    hasDraft,
    lastSaved,
    restoreDraft,
    clearDraft,
    discardDraft,
  } = useFormPersistence(formData, setFormData, {
    key: 'embed_application',
    expiryHours: 24,
  });

  // Capture URL parameters on mount
  useEffect(() => {
    const getParam = (...names: string[]): string => {
      for (const name of names) {
        const value = searchParams.get(name);
        if (value) return value;
      }
      return '';
    };

    const urlParams: Partial<FormData> = {
      ad_id: getParam('ad_id', 'adId', 'AdID', 'ad'),
      campaign_id: getParam('campaign_id', 'campaignId', 'CampaignID', 'campaign'),
      adset_id: getParam('adset_id', 'adsetId', 'AdsetID', 'adset'),
      job_listing_id: getParam('job_listing_id', 'jobListingId', 'JobListingID', 'job', 'job_id', 'jobId'),
      job_id: getParam('job_id', 'jobId', 'JobID'),
      org_slug: getParam('org', 'organization', 'org_slug'),
      utm_source: getParam('utm_source', 'utmSource', 'source'),
      utm_medium: getParam('utm_medium', 'utmMedium', 'medium'),
      utm_campaign: getParam('utm_campaign', 'utmCampaign', 'campaign_name'),
      referral_source: document.referrer || '',
    };

    setFormData(prev => ({ ...prev, ...urlParams }));
  }, [searchParams]);

  // Calculate current step based on filled fields
  useEffect(() => {
    const hasPersonalInfo = formData.firstName && formData.lastName && formData.email && formData.phone && formData.zip && formData.over21;
    const hasCDLInfo = formData.cdl && formData.experience;
    const hasBackgroundInfo = formData.drug;
    const hasConsent = formData.consent && formData.privacy;

    if (hasConsent) setCurrentStep(4);
    else if (hasBackgroundInfo) setCurrentStep(4);
    else if (hasCDLInfo) setCurrentStep(3);
    else if (hasPersonalInfo) setCurrentStep(2);
    else setCurrentStep(1);
  }, [formData]);

  const getExperienceValue = useCallback((months: string) => {
    if (!months) return '';
    const monthsNum = parseInt(months);
    return monthsNum < 3 ? 'Less than 3 months' : 'More than 3 months';
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('Please enter your first name');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Please enter your last name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!formData.zip.trim()) {
      toast.error('Please enter your ZIP code');
      return false;
    }

    const requiredFields = [
      { field: 'over21' as keyof FormData, label: 'age verification' },
      { field: 'cdl' as keyof FormData, label: 'CDL status' },
      { field: 'experience' as keyof FormData, label: 'experience' },
      { field: 'drug' as keyof FormData, label: 'drug test response' },
      { field: 'consent' as keyof FormData, label: 'SMS consent' },
      { field: 'privacy' as keyof FormData, label: 'privacy policy agreement' },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please select ${label}`);
        return false;
      }
    }

    return true;
  }, [formData]);

  const submitApplication = useMutation({
    mutationFn: async (data: FormData): Promise<SubmitResponse> => {
      const monthsNum = parseInt(data.experience) || 0;
      const drivingExperienceYears = Math.floor(monthsNum / 12);

      // CRITICAL: Set source to 'Embed Form' for outbound voice agent routing
      const formattedData = {
        ...data,
        phone: normalizePhoneNumber(data.phone),
        months: data.experience,
        exp: getExperienceValue(data.experience),
        driving_experience_years: drivingExperienceYears,
        source: 'Embed Form', // <-- Routes to dedicated outbound agent
      };

      const response = await fetch('https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        referrerPolicy: 'unsafe-url', // Send full path so backend detects /embed/apply
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      const result = await response.json();
      return result.data || result;
    },
    onSuccess: (data) => {
      clearDraft();
      toast.success('Application submitted successfully! Check your email for confirmation.');
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const handleInputChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitApplication.mutate(formData);
  }, [formData, submitApplication, validateForm]);

  return {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting: submitApplication.isPending,
    currentStep,
    hasDraft,
    lastSaved,
    restoreDraft,
    discardDraft,
  };
};
